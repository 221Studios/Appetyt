"""Three separate store catalogs (Frisco, Auchan, Carrefour) + recipe cost math."""

from __future__ import annotations

import json
import math
import sqlite3
from pathlib import Path

from backend.app.units import normalize_amount

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "docs" / "database" / "0002_store_products.sql"
DATA_DIR = ROOT / "data"

STORES = {
    "frisco": "Frisco",
    "auchan": "Auchan",
    "carrefour": "Carrefour",
}

def db_path(store_slug: str, data_dir: Path | None = None) -> Path:
    if store_slug not in STORES:
        raise ValueError(f"unknown store: {store_slug}")
    return (data_dir or DATA_DIR) / f"{store_slug}.sqlite"


def package_size_g(qty: float, unit: str) -> float | None:
    normalized = normalize_amount(qty, unit)
    if normalized is None or normalized[1] == "piece":
        return None
    return normalized[0]


def price_per_100g(price_pln: float, size_g: float | None) -> float | None:
    if size_g is None or size_g <= 0:
        return None
    return price_pln / size_g * 100.0


def usage_cost(price_pln: float, package_qty: float, used_qty: float) -> float:
    if package_qty <= 0:
        raise ValueError("package_qty must be > 0")
    return price_pln * (used_qty / package_qty)


def basket_cost(price_pln: float, package_qty: float, used_qty: float) -> float:
    if package_qty <= 0:
        raise ValueError("package_qty must be > 0")
    if used_qty <= 0:
        return 0.0
    packs = math.ceil(used_qty / package_qty)
    return packs * price_pln


def init_store_db(store_slug: str, data_dir: Path | None = None) -> Path:
    path = db_path(store_slug, data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    conn = sqlite3.connect(path)
    try:
        conn.executescript(schema)
        conn.execute(
            "INSERT OR REPLACE INTO store_meta (store_slug, store_name) VALUES (?, ?)",
            (store_slug, STORES[store_slug]),
        )
        conn.commit()
    finally:
        conn.close()
    return path


def init_all_store_dbs(data_dir: Path | None = None) -> list[Path]:
    return [init_store_db(slug, data_dir) for slug in STORES]


def _read_store_slug(conn: sqlite3.Connection) -> str:
    row = conn.execute("SELECT store_slug FROM store_meta").fetchone()
    if row is None:
        raise ValueError("store_meta is empty")
    return row[0]


def import_catalog(
    json_path: Path,
    store_slug: str | None = None,
    data_dir: Path | None = None,
) -> int:
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    slug = payload.get("store")
    if slug not in STORES:
        raise ValueError("catalog JSON must set store to frisco, auchan, or carrefour")
    if store_slug is not None and store_slug != slug:
        raise ValueError(f"JSON store={slug} does not match --store {store_slug}")
    fetched_at = payload.get("fetched_at")
    if not fetched_at:
        raise ValueError("catalog JSON needs fetched_at")
    products = payload.get("products")
    if not isinstance(products, list):
        raise ValueError("catalog JSON needs products: []")

    init_store_db(slug, data_dir)
    conn = sqlite3.connect(db_path(slug, data_dir))
    try:
        if _read_store_slug(conn) != slug:
            raise ValueError("database store_meta does not match catalog store")
        rows = []
        for item in products:
            product_id = str(item["product_id"]).strip()
            name = (item.get("name") or "").strip()
            qty = float(item["package_qty"])
            unit = str(item["package_unit"]).strip()
            price = float(item["price_pln"])
            if not product_id or not name:
                raise ValueError("each product needs product_id and name")
            size_g = package_size_g(qty, unit)
            rows.append(
                (
                    product_id,
                    (item.get("ean") or None),
                    name,
                    (item.get("brand") or None),
                    (item.get("category") or None),
                    qty,
                    unit,
                    size_g,
                    price,
                    price_per_100g(price, size_g),
                    (item.get("url") or None),
                    str(item.get("fetched_at") or fetched_at),
                    item.get("ingredient_id"),
                )
            )
        conn.executemany(
            """
            INSERT OR REPLACE INTO products (
                product_id, ean, name, brand, category,
                package_qty, package_unit, package_size_g,
                price_pln, price_per_100g, url, fetched_at, ingredient_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        conn.commit()
        return len(rows)
    finally:
        conn.close()
