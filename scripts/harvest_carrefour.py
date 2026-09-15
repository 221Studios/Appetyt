#!/usr/bin/env python3
"""Harvest Carrefour.pl food categories from an already-open Chrome (CDP)."""

from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path

import urllib.request
import websockets

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw" / "carrefour" / "catalog.json"
CDP = "http://127.0.0.1:9223"

CATEGORIES = [
    "/mleko-nabial-jaja",
    "/artykuly-spozywcze",
    "/owoce-warzywa-ziola",
    "/mieso",
    "/mrozonki",
    "/wedliny-kielbasy",
    "/piekarnia-ciastkarnia",
    "/ryby-i-owoce-morza",
    "/zdrowa-zywnosc",
    "/napoje",
    "/dania-gotowe-i-przystawki",
]

EXTRACT_JS = r"""
(() => {
  const el = document.getElementById('__NEXT_DATA__');
  if (!el || !el.textContent) return { ok: false, reason: 'no-next-data' };
  let d;
  try {
    d = JSON.parse(el.textContent);
  } catch (e) {
    return { ok: false, reason: 'parse' };
  }
  const data = (((d.props || {}).initialState || {}).products || {}).data || {};
  return {
    ok: true,
    url: location.href,
    totalCount: data.totalCount || 0,
    totalPages: data.totalPages || 0,
    content: (data.content || []).map((p) => {
      const sku = p.actualSku || {};
      const prod = p.product || {};
      return {
        displayName: p.displayName || p.name,
        name: p.name,
        slug: p.slug,
        url: p.url,
        brandName: p.brandName,
        defaultCategoryName: p.defaultCategoryName,
        product: {
          code: prod.code,
          size: prod.size,
          grammageUnit: prod.grammageUnit,
          sellUnitString: prod.sellUnitString,
        },
        actualSku: {
          amount: { actualGrossPrice: (sku.amount || {}).actualGrossPrice },
          lowestAmount: { actualGrossPrice: (sku.lowestAmount || {}).actualGrossPrice },
        },
      };
    }),
    queryPage: (d.query || {}).page || null,
  };
})()
"""


def page_ws() -> str:
    pages = json.load(urllib.request.urlopen(f"{CDP}/json/list"))
    for p in pages:
        if p.get("type") == "page" and "carrefour.pl" in (p.get("url") or ""):
            return p["webSocketDebuggerUrl"]
    raise SystemExit("no Carrefour tab on :9223")


class Cdp:
    def __init__(self) -> None:
        self.n = 0

    async def call(self, conn, method: str, params: dict | None = None):
        self.n += 1
        i = self.n
        await conn.send(json.dumps({"id": i, "method": method, "params": params or {}}))
        while True:
            try:
                raw = await conn.recv()
            except Exception as e:
                raise RuntimeError(f"cdp recv failed: {e}")
            msg = json.loads(raw)
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
            return None
        return (res.get("result") or {}).get("value")

    async def navigate(self, conn, url: str, expect_page: str | None) -> dict:
        await self.call(conn, "Page.navigate", {"url": url})
        for _ in range(48):
            await asyncio.sleep(0.25)
            data = await self.eval(conn, EXTRACT_JS)
            if not data or not data.get("ok"):
                continue
            if expect_page is None:
                if data.get("queryPage") is None and data.get("content") is not None:
                    return data
            elif str(data.get("queryPage")) == str(expect_page) and data.get("content") is not None:
                return data
        raise TimeoutError(f"timeout loading {url}")


def unit_of(raw: dict) -> str:
    prod = raw.get("product") or {}
    unit = (prod.get("grammageUnit") or prod.get("sellUnitString") or "szt").strip().lower()
    unit = unit.replace(".", "")
    if unit in ("kg", "g", "l", "ml", "szt"):
        return unit
    return "szt"


def map_item(raw: dict, category: str) -> dict | None:
    name = (raw.get("displayName") or raw.get("name") or "").strip()
    slug = (raw.get("slug") or "").strip()
    if not name or not slug:
        return None
    sku = raw.get("actualSku") or {}
    price = ((sku.get("amount") or {}).get("actualGrossPrice"))
    if price is None:
        price = ((sku.get("lowestAmount") or {}).get("actualGrossPrice"))
    if price is None:
        return None
    prod = raw.get("product") or {}
    qty = prod.get("size")
    unit = unit_of(raw)
    if qty is None:
        qty = 1.0
        unit = "szt"
    path = (raw.get("url") or slug).lstrip("/")
    return {
        "product_id": slug,
        "ean": prod.get("code"),
        "name": name,
        "brand": raw.get("brandName"),
        "category": raw.get("defaultCategoryName") or category,
        "package_qty": float(qty),
        "package_unit": unit,
        "price_pln": float(price),
        "url": f"https://www.carrefour.pl/{path}",
        "ingredient_id": None,
    }


async def load_category(cdp: Cdp, conn, path: str) -> list[dict]:
    first = await cdp.navigate(conn, "https://www.carrefour.pl" + path, None)
    total_pages = int(first.get("totalPages") or 1)
    total_count = int(first.get("totalCount") or 0)
    pages_raw = [first.get("content") or []]
    for page in range(1, total_pages):
        data = await cdp.navigate(
            conn, f"https://www.carrefour.pl{path}?page={page}", str(page)
        )
        pages_raw.append(data.get("content") or [])
        print(f"  {path} page {page}/{total_pages - 1} n={len(pages_raw[-1])}", flush=True)
    items = [row for chunk in pages_raw for row in chunk]
    print(
        f"{path}: pages {total_pages} listed {total_count} extracted {len(items)}",
        flush=True,
    )
    return items


def write_catalog(products: dict[str, dict]) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    catalog = {
        "store": "carrefour",
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "products": list(products.values()),
    }
    OUT.write_text(json.dumps(catalog, ensure_ascii=False), encoding="utf-8")


async def main() -> None:
    ws = page_ws()
    products: dict[str, dict] = {}
    async with websockets.connect(ws, max_size=50_000_000) as conn:
        cdp = Cdp()
        await cdp.eval(conn, "1")
        await cdp.call(conn, "Page.enable")
        for path in CATEGORIES:
            cat = path.strip("/")
            for raw in await load_category(cdp, conn, path):
                mapped = map_item(raw, cat)
                if mapped:
                    products[mapped["product_id"]] = mapped
            write_catalog(products)
            print(f"{path}: unique_now {len(products)} checkpointed", flush=True)
    print("wrote", OUT, "n", len(products), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
