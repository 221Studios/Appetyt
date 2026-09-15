#!/usr/bin/env python3
"""Set products.ingredient_id from USDA names + Polish grocery rules."""

from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.map_store_ingredients import map_products
from scripts.store_dbs import db_path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--store", default="frisco", choices=("frisco", "auchan", "carrefour"))
    args = parser.parse_args()
    ing = sqlite3.connect(ROOT / "data" / "ingredients.sqlite")
    store = sqlite3.connect(db_path(args.store))
    try:
        stats = map_products(ing, store)
    finally:
        ing.close()
        store.close()
    print(
        f"{args.store}: mapped {stats['mapped']}/{stats['products']} "
        f"products to {stats['ingredients']} ingredients"
    )


if __name__ == "__main__":
    main()
