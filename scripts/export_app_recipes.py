"""Export crawled recipes to backend-shaped JSON. Read-only on recipes.sqlite."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.app_recipe import build_app_recipe, is_app_ready, load_nutrients

ROOT = Path(__file__).resolve().parents[1]
RECIPES_DB = ROOT / "data" / "recipes.sqlite"
OUT_PATH = ROOT / "data" / "app_recipes.json"


def open_recipes(path: Path) -> sqlite3.Connection:
    return sqlite3.connect(f"file:{path}?mode=ro", uri=True)


def export_app_recipes(
    db_path: Path = RECIPES_DB,
    out_path: Path = OUT_PATH,
    limit: int = 0,
    min_mapped_ratio: float = 0.0,
    min_mapped_count: int = 0,
    creator_id: str | None = None,
) -> dict:
    conn = open_recipes(db_path)
    conn.row_factory = sqlite3.Row
    sql = (
        "SELECT source_url, creator_id, title, prep_minutes, cook_minutes, "
        "total_minutes, recipe_yield, ingredients_json, ingredient_sections_json, "
        "source_steps_json, fetched_at "
        "FROM recipes"
    )
    params: list = []
    if creator_id:
        sql += " WHERE creator_id = ?"
        params.append(creator_id)
    sql += " ORDER BY fetched_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    nutrients = load_nutrients()
    ready = []
    scanned = 0
    for row in rows:
        scanned += 1
        payload = build_app_recipe(
            {
                "source_url": row["source_url"],
                "creator_id": row["creator_id"],
                "title": row["title"],
                "prep_minutes": row["prep_minutes"],
                "cook_minutes": row["cook_minutes"],
                "total_minutes": row["total_minutes"],
                "recipe_yield": row["recipe_yield"],
                "ingredients": row["ingredients_json"],
                "ingredient_sections": row["ingredient_sections_json"],
                "source_steps": row["source_steps_json"],
                "fetched_at": row["fetched_at"],
            },
            nutrients=nutrients,
        )
        if not is_app_ready(
            payload,
            min_mapped_ratio=min_mapped_ratio,
            min_mapped_count=min_mapped_count,
        ):
            continue
        ready.append(
            {
                k: v
                for k, v in payload.items()
                if k not in {"mapped_count", "mapped_ratio", "ingredient_count"}
            }
        )
        if 0 < limit <= len(ready):
            break
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(ready, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"scanned": scanned, "exported": len(ready), "path": str(out_path)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="0 = wszystkie pasujące")
    parser.add_argument("--min-mapped-ratio", type=float, default=0.0)
    parser.add_argument("--min-mapped-count", type=int, default=0)
    parser.add_argument("--creator-id")
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args()
    stats = export_app_recipes(
        out_path=args.out,
        limit=args.limit,
        min_mapped_ratio=args.min_mapped_ratio,
        min_mapped_count=args.min_mapped_count,
        creator_id=args.creator_id,
    )
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
