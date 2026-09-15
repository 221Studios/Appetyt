#!/usr/bin/env python3
"""Create empty Frisco, Auchan, and Carrefour SQLite catalogs."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.store_dbs import init_all_store_dbs


def main() -> None:
    for path in init_all_store_dbs():
        print(path)


if __name__ == "__main__":
    main()
