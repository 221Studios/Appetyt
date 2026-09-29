"""Backfill semantic ingredient groups without changing raw ingredient lines."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.ingredient_sections import ingredient_structure  # noqa: E402

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"


def backfill(db_path: Path = DEFAULT_DB, *, dry_run: bool = False) -> dict[str, int | str]:
    connection = sqlite3.connect(db_path)
    updated = 0
    titled_recipes = 0
    ignored_lines = 0
    try:
        columns = {row[1] for row in connection.execute("PRAGMA table_info(recipes)")}
        if "ingredient_sections_json" not in columns:
            connection.execute("ALTER TABLE recipes ADD COLUMN ingredient_sections_json TEXT")

        rows = connection.execute(
            "SELECT source_url, ingredients_json, ingredient_sections_json FROM recipes"
        ).fetchall()
        for source_url, ingredients_json, current_json in rows:
            ingredients = json.loads(ingredients_json or "[]")
            structure = ingredient_structure(ingredients)
            serialized = json.dumps(structure, ensure_ascii=False, separators=(",", ":"))
            if current_json != serialized:
                updated += 1
                if not dry_run:
                    connection.execute(
                        "UPDATE recipes SET ingredient_sections_json = ? WHERE source_url = ?",
                        (serialized, source_url),
                    )
            if any(group.get("title") for group in structure["groups"]):
                titled_recipes += 1
            ignored_lines += len(structure["ignored"])
        if dry_run:
            connection.rollback()
        else:
            connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
    return {
        "db": str(db_path),
        "recipes": len(rows),
        "updated": updated,
        "recipes_with_sections": titled_recipes,
        "ignored_non_ingredient_lines": ignored_lines,
        "dry_run": dry_run,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(backfill(args.db, dry_run=args.dry_run), ensure_ascii=False))


if __name__ == "__main__":
    main()
