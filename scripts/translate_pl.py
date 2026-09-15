#!/usr/bin/env python3
"""Fill ingredients.name_pl from USDA English names."""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from usda_pl_glossary import polish_cleanup, prepare_english

DB_PATH = ROOT / "data" / "ingredients.sqlite"
CACHE_PATH = ROOT / "data" / "name_pl.json"


def load_cache() -> dict[str, str]:
    if not CACHE_PATH.exists():
        return {}
    return json.loads(CACHE_PATH.read_text(encoding="utf-8"))


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=0, sort_keys=True),
        encoding="utf-8",
    )


def translate_unique(names: list[str], cache: dict[str, str]) -> dict[str, str]:
    import argostranslate.translate as argos

    missing = [n for n in names if n not in cache]
    for i, name in enumerate(missing, start=1):
        prepared = prepare_english(name)
        translated = argos.translate(prepared, "en", "pl") if prepared else name
        cache[name] = polish_cleanup(translated) or name
        if i % 250 == 0:
            print(f"translated {i}/{len(missing)}")
            save_cache(cache)
    return cache


def apply_to_db(db_path: Path = DB_PATH) -> dict[str, int]:
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT ingredient_id, name_en FROM ingredients"
        ).fetchall()
        unique_names = sorted({name for _, name in rows})
        cache = load_cache()
        translate_unique(unique_names, cache)
        save_cache(cache)
        updates = [(cache[name], fdc_id) for fdc_id, name in rows]
        conn.executemany(
            "UPDATE ingredients SET name_pl = ? WHERE ingredient_id = ?",
            updates,
        )
        conn.commit()
        empty = conn.execute(
            "SELECT COUNT(*) FROM ingredients WHERE name_pl IS NULL OR trim(name_pl) = ''"
        ).fetchone()[0]
        return {"rows": len(rows), "unique_names": len(unique_names), "empty_pl": empty}
    finally:
        conn.close()


def main() -> None:
    stats = apply_to_db()
    print(f"updated {DB_PATH}")
    for key, value in stats.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
