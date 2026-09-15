#!/usr/bin/env python3
"""Harvest zakupy.auchan.pl food categories from an already-open Chrome (CDP)."""

from __future__ import annotations

import asyncio
import json
import re
import time
from pathlib import Path
from urllib.parse import quote

import urllib.request
import websockets

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw" / "auchan" / "catalog.json"
PROGRESS = OUT.with_suffix(".progress.json")
CDP = "http://127.0.0.1:9223"

# Sibling food trees on the Ocado-style shop (skip chemia, alkohol, non-food).
CATEGORIES = [
    ("2091", "Artykuły spożywcze"),
    ("3177", "Zdrowa żywność"),
    ("4324", "Kawa, Herbata i kakao"),
]

FETCH_JS = r"""
(async (categoryId, pageToken) => {
  const q = new URLSearchParams({
    retailerCategoryId: categoryId,
    maxPageSize: '100',
    maxProductsToDecorate: '100',
    includeAdditionalPageInfo: 'true',
  });
  q.append('tag', 'web');
  q.append('tag', 'category-item');
  if (pageToken) q.set('pageToken', pageToken);
  const r = await fetch('/api/webproductpagews/v6/product-pages?' + q.toString(), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!r.ok) return { ok: false, status: r.status };
  const j = await r.json();
  const group = (j.productGroups || [])[0] || {};
  const items = (group.decoratedProducts || []).map((p) => {
    const path = (p.categoryPath || []).map((c) => c.name || c).filter(Boolean);
    return {
      sku: p.retailerProductId,
      productId: p.productId,
      name: p.name,
      brand: p.brand,
      pack: p.packSizeDescription,
      price: ((p.promoPrice && p.promoPrice.amount) || (p.price && p.price.amount) || null),
      category: path.length ? path[path.length - 1] : null,
    };
  });
  const current = (j.additionalPageInfo && j.additionalPageInfo.currentCategory) || {};
  return {
    ok: true,
    n: items.length,
    total: current.productCount || null,
    next: (j.metadata && j.metadata.nextPageToken) || null,
    items,
  };
})
"""


def page_ws() -> str:
    pages = json.load(urllib.request.urlopen(f"{CDP}/json/list"))
    for p in pages:
        if p.get("type") == "page" and "auchan.pl" in (p.get("url") or ""):
            return p["webSocketDebuggerUrl"]
    raise SystemExit("no Auchan tab on :9223")


class Cdp:
    def __init__(self) -> None:
        self.n = 0

    async def call(self, conn, method: str, params: dict | None = None):
        self.n += 1
        i = self.n
        await conn.send(json.dumps({"id": i, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(await conn.recv())
            if msg.get("id") == i:
                if msg.get("error"):
                    raise RuntimeError(msg["error"])
                return msg.get("result")

    async def eval(self, conn, expr: str, await_promise=False):
        res = await self.call(
            conn,
            "Runtime.evaluate",
            {
                "expression": expr,
                "returnByValue": True,
                "awaitPromise": await_promise,
            },
        )
        err = res.get("exceptionDetails")
        if err:
            raise RuntimeError(err)
        return (res.get("result") or {}).get("value")


def parse_pack(pack: str, name: str) -> tuple[float, str]:
    blob = f"{pack or ''} {name or ''}"
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|szt)\b", blob, re.I)
    if not m:
        return 1.0, "szt"
    qty = float(m.group(1).replace(",", "."))
    unit = m.group(2).lower()
    return qty, unit


def slugify(name: str) -> str:
    table = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzacelnoszz")
    s = (name or "").translate(table).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "produkt"


def map_item(raw: dict, fallback_cat: str) -> dict | None:
    sku = str(raw.get("sku") or "").strip()
    name = (raw.get("name") or "").strip()
    if not sku or not name:
        return None
    price = raw.get("price")
    if price is None:
        return None
    qty, unit = parse_pack(raw.get("pack") or "", name)
    return {
        "product_id": sku,
        "ean": None,
        "name": name,
        "brand": raw.get("brand"),
        "category": raw.get("category") or fallback_cat,
        "package_qty": qty,
        "package_unit": unit,
        "price_pln": float(price),
        "url": f"https://zakupy.auchan.pl/products/{quote(slugify(name))}/{sku}",
        "ingredient_id": None,
    }


def write_catalog(products: dict[str, dict]) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    catalog = {
        "store": "auchan",
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "products": list(products.values()),
    }
    OUT.write_text(json.dumps(catalog, ensure_ascii=False), encoding="utf-8")


async def load_category(cdp: Cdp, conn, category_id: str) -> list[dict]:
    token = None
    items: list[dict] = []
    total = None
    for page in range(400):
        expr = f"({FETCH_JS})({json.dumps(category_id)}, {json.dumps(token)})"
        data = None
        for attempt in range(6):
            data = await cdp.eval(conn, expr, await_promise=True)
            if data and data.get("ok"):
                break
            await asyncio.sleep(1.5 * (attempt + 1))
        if not data or not data.get("ok"):
            raise RuntimeError(f"listing failed {category_id} page={page} {data}")
        if data.get("total"):
            total = data["total"]
        chunk = data.get("items") or []
        items.extend(chunk)
        token = data.get("next")
        print(
            f"  {category_id} page {page} n={len(chunk)} unique_run={len(items)} next={bool(token)}",
            flush=True,
        )
        if not token or not chunk:
            break
        await asyncio.sleep(0.4)
    print(f"{category_id}: listed~{total} extracted {len(items)}", flush=True)
    return items


async def main() -> None:
    ws = page_ws()
    products: dict[str, dict] = {}
    done: set[str] = set()
    if OUT.exists():
        prev = json.loads(OUT.read_text(encoding="utf-8"))
        for item in prev.get("products") or []:
            pid = str(item.get("product_id") or "")
            if pid:
                products[pid] = item
    if PROGRESS.exists():
        done = set(json.loads(PROGRESS.read_text(encoding="utf-8")))
    async with websockets.connect(ws, max_size=50_000_000) as conn:
        cdp = Cdp()
        await cdp.eval(conn, "1")
        loc = await cdp.eval(conn, "location.href")
        if "zakupy.auchan.pl" not in (loc or ""):
            await cdp.call(conn, "Page.enable")
            await cdp.call(conn, "Page.navigate", {"url": "https://zakupy.auchan.pl/categories"})
            await asyncio.sleep(3)
        for cat_id, cat_name in CATEGORIES:
            if cat_id in done:
                print(f"{cat_id}: skip (already done)", flush=True)
                continue
            for raw in await load_category(cdp, conn, cat_id):
                mapped = map_item(raw, cat_name)
                if mapped:
                    products[mapped["product_id"]] = mapped
            done.add(cat_id)
            write_catalog(products)
            PROGRESS.write_text(json.dumps(sorted(done)), encoding="utf-8")
            print(f"{cat_id}: unique_now {len(products)} checkpointed", flush=True)
    print("wrote", OUT, "n", len(products), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
