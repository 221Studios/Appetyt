#!/usr/bin/env python3
"""Load a store catalog JSON into that store's SQLite file."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.store_dbs import import_catalog


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("json_path", type=Path)
    parser.add_argument("--store", choices=("frisco", "auchan", "carrefour"))
    args = parser.parse_args()
    n = import_catalog(args.json_path, store_slug=args.store)
    print(f"imported {n} products")


if __name__ == "__main__":
    main()
