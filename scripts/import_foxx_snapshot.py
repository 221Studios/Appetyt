"""Import the Foxx source snapshot into the canonical recipes database.

This is deliberately separate from app export: every discovered source page is
kept in ``recipes.sqlite`` with its source ingredient lines and source steps,
while only strict-complete rows are eligible for ``app_recipes.json``.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.foxx_snapshot import parse_foxx_page
from scripts.schema_recipe import save_recipe

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
FULL_SNAPSHOT = ROOT / "data" / "foxx_gotuje_recipes_full.json"
SUPPLEMENTAL_SNAPSHOT = ROOT / "data" / "foxx_gotuje_supplemental.json"
NORMALIZED_SNAPSHOT = ROOT / "data" / "foxx_gotuje_source_snapshot.json"
CREATOR_ID = "foxx_gotuje"


def _read_pages(path: Path) -> tuple[list[dict], str | None]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    pages = payload.get("recipes") or []
    if not isinstance(pages, list):
        raise ValueError(f"Invalid recipe list in {path}")
    return [page for page in pages if isinstance(page, dict)], payload.get("retrieved_at")


def load_snapshot_pages(
    full_snapshot: Path = FULL_SNAPSHOT,
    supplemental_snapshot: Path = SUPPLEMENTAL_SNAPSHOT,
) -> tuple[list[dict], str | None]:
    pages, fetched_at = _read_pages(full_snapshot)
    if supplemental_snapshot.exists():
        extra, extra_fetched_at = _read_pages(supplemental_snapshot)
        pages.extend(extra)
        fetched_at = extra_fetched_at or fetched_at

    unique: dict[str, dict] = {}
    for page in pages:
        parsed = parse_foxx_page(page)
        if not parsed["source_url"]:
            raise ValueError(f"Missing source_url for {parsed['title']}")
        unique[str(parsed["source_url"])] = page
    return list(unique.values()), fetched_at


def source_recipe(page: dict) -> dict:
    parsed = parse_foxx_page(page)
    recipe = page.get("recipe") if isinstance(page.get("recipe"), dict) else {}
    return {
        "title": parsed["title"],
        "source_url": parsed["source_url"],
        "prep_minutes": recipe.get("prepTime") if isinstance(recipe, dict) else None,
        "cook_minutes": recipe.get("cookTime") if isinstance(recipe, dict) else None,
        "total_minutes": recipe.get("totalTime") if isinstance(recipe, dict) else None,
        "recipe_yield": recipe.get("recipeYield") if isinstance(recipe, dict) else None,
        "ingredients": parsed["ingredients"],
        "source_steps": parsed["source_steps"],
    }


def import_snapshot(
    db_path: Path = DEFAULT_DB,
    full_snapshot: Path = FULL_SNAPSHOT,
    supplemental_snapshot: Path = SUPPLEMENTAL_SNAPSHOT,
    normalized_snapshot: Path = NORMALIZED_SNAPSHOT,
) -> dict[str, int | str]:
    pages, fetched_at = load_snapshot_pages(full_snapshot, supplemental_snapshot)
    imported = 0
    normalized: list[dict] = []
    for page in pages:
        parsed = parse_foxx_page(page)
        normalized.append(
            {
                "creator_id": CREATOR_ID,
                "title": parsed["title"],
                "source_url": parsed["source_url"],
                "language": parsed["language"],
                "ingredients": parsed["ingredients"],
                "source_steps": parsed["source_steps"],
                "sections": parsed["sections"],
            }
        )
        save_recipe(
            source_recipe(page),
            creator_id=CREATOR_ID,
            db_path=db_path,
            fetched_at=fetched_at,
        )
        imported += 1
    normalized_snapshot.write_text(
        json.dumps(
            {
                "schema_version": "foxx-source-snapshot-v1",
                "creator_id": CREATOR_ID,
                "retrieved_at": fetched_at,
                "recipe_count": len(normalized),
                "recipes": normalized,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    conn = sqlite3.connect(db_path)
    try:
        total = conn.execute(
            "SELECT COUNT(*) FROM recipes WHERE creator_id = ?", (CREATOR_ID,)
        ).fetchone()[0]
    finally:
        conn.close()
    return {
        "imported": imported,
        "creator_count": int(total),
        "db": str(db_path),
        "normalized_snapshot": str(normalized_snapshot),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--full", type=Path, default=FULL_SNAPSHOT)
    parser.add_argument("--supplemental", type=Path, default=SUPPLEMENTAL_SNAPSHOT)
    parser.add_argument("--normalized", type=Path, default=NORMALIZED_SNAPSHOT)
    args = parser.parse_args()
    print(
        json.dumps(
            import_snapshot(args.db, args.full, args.supplemental, args.normalized),
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
