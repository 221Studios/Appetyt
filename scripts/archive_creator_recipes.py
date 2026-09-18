"""Przenieś wiersze twórcy z kanonicznego recipes.sqlite do data/archive/."""

from __future__ import annotations

import argparse
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_ARCHIVE = ROOT / "data" / "archive"

RECIPE_COLUMNS = (
    "source_url",
    "creator_id",
    "title",
    "prep_minutes",
    "cook_minutes",
    "total_minutes",
    "recipe_yield",
    "ingredients_json",
    "source_steps_json",
    "fetched_at",
)

CREATE_RECIPES = """
CREATE TABLE IF NOT EXISTS recipes (
    source_url TEXT PRIMARY KEY,
    creator_id TEXT,
    title TEXT NOT NULL,
    prep_minutes INTEGER,
    cook_minutes INTEGER,
    total_minutes INTEGER,
    recipe_yield TEXT,
    ingredients_json TEXT NOT NULL,
    source_steps_json TEXT,
    fetched_at TEXT NOT NULL
);
"""


def archive_creator_recipes(
    creator_id: str,
    *,
    recipes_db: Path | None = None,
    archive_dir: Path | None = None,
    when: datetime | None = None,
) -> dict:
    """Skopiuj wiersze ``creator_id`` do archiwum i usuń je z kanonicznej bazy.

    Zwraca ``{"archived": int, "archive_path": str | None, "creator_id": str}``.
    Gdy w kanonicznej bazie nie ma wierszy twórcy — no-op (``archived=0``).
    """
    db_path = Path(recipes_db or DEFAULT_DB)
    out_dir = Path(archive_dir or DEFAULT_ARCHIVE)
    stamp = (when or datetime.now(timezone.utc)).strftime("%Y%m%dT%H%M%SZ")

    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            f"SELECT {', '.join(RECIPE_COLUMNS)} FROM recipes WHERE creator_id = ?",
            (creator_id,),
        ).fetchall()
        if not rows:
            return {
                "archived": 0,
                "archive_path": None,
                "creator_id": creator_id,
            }

        creator_dir = out_dir / creator_id
        creator_dir.mkdir(parents=True, exist_ok=True)
        archive_path = creator_dir / f"recipes-{stamp}.sqlite"

        arch = sqlite3.connect(archive_path)
        try:
            arch.execute(CREATE_RECIPES)
            placeholders = ", ".join("?" for _ in RECIPE_COLUMNS)
            arch.executemany(
                f"INSERT INTO recipes ({', '.join(RECIPE_COLUMNS)}) "
                f"VALUES ({placeholders})",
                rows,
            )
            arch.commit()
        finally:
            arch.close()

        conn.execute("DELETE FROM recipes WHERE creator_id = ?", (creator_id,))
        conn.commit()
    finally:
        conn.close()

    return {
        "archived": len(rows),
        "archive_path": str(archive_path),
        "creator_id": creator_id,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Archive one creator's recipes out of the canonical corpus."
    )
    parser.add_argument("creator_id")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--archive-dir", type=Path, default=DEFAULT_ARCHIVE)
    args = parser.parse_args()
    result = archive_creator_recipes(
        args.creator_id,
        recipes_db=args.db,
        archive_dir=args.archive_dir,
    )
    print(result)


if __name__ == "__main__":
    main()
