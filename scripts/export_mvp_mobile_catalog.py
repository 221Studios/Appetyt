"""Eksport MVP źródło → katalog mobilny (link + składniki 1:1, bez sklepów)."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.audit_mvp_source import CREATORS, load_catalog_urls
from scripts.ingredient_match import normalize_ingredient_list
from scripts.recipe_line import operational_steps, parse_servings, recipe_id
from scripts.app_recipe import duration_minutes, category_and_cuisine

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_OUT = ROOT / "data" / "mobile_catalog.json"
APP_PUBLIC = ROOT / "cheftable-przepiśnik" / "public" / "recipes.json"


def _load_mvp_urls() -> list[tuple[str, str]]:
    """Zwraca listę (creator_id, source_url) z katalogów MVP."""
    pairs: list[tuple[str, str]] = []
    for creator_id, meta in CREATORS.items():
        for url in load_catalog_urls(meta["catalog"]):
            pairs.append((creator_id, url))
    pairs.sort(key=lambda item: (item[0], item[1]))
    return pairs


def build_mvp_mobile_recipe(row: sqlite3.Row) -> dict:
    """Kompaktowy rekord MVP: same stringi 1:1, bez nulli/kosztów/makro."""
    ingredients_raw = json.loads(row["ingredients_json"] or "[]")
    source_steps = json.loads(row["source_steps_json"] or "[]")
    if not isinstance(source_steps, list):
        source_steps = []
    ingredients = normalize_ingredient_list(ingredients_raw)
    steps = [str(text).strip() for text in source_steps if str(text).strip()]
    if not steps:
        steps = [
            str(item.get("instructions") or item.get("title") or "").strip()
            for item in operational_steps(source_steps)
            if isinstance(item, dict)
        ]
        steps = [text for text in steps if text]
    title = (row["title"] or "Przepis").strip()[:240]
    category, _cuisine = category_and_cuisine(title)
    servings = parse_servings(row["recipe_yield"]) or 4
    source_url = row["source_url"]
    return {
        "id": recipe_id(row["creator_id"], source_url),
        "title": title,
        "category": category,
        "creator_id": row["creator_id"],
        "source_url": source_url,
        "duration_minutes": duration_minutes(
            {
                "total_minutes": row["total_minutes"],
                "prep_minutes": row["prep_minutes"],
                "cook_minutes": row["cook_minutes"],
            }
        ),
        "servings": servings,
        "ingredients": ingredients,
        "steps": steps,
    }


def export_mvp_mobile_catalog(
    *,
    recipes_db: Path | None = None,
    out_path: Path | None = None,
    also_public: bool = True,
) -> dict:
    db = Path(recipes_db or DEFAULT_DB)
    out = Path(out_path or DEFAULT_OUT)
    pairs = _load_mvp_urls()
    urls = [url for _, url in pairs]
    conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT source_url, creator_id, title, prep_minutes, cook_minutes, "
        "total_minutes, recipe_yield, ingredients_json, source_steps_json, fetched_at "
        "FROM recipes WHERE source_url IN ({})".format(
            ",".join("?" for _ in urls) or "NULL"
        ),
        tuple(urls),
    ).fetchall()
    conn.close()
    by_url = {row["source_url"]: row for row in rows}

    exported: list[dict] = []
    missing: list[str] = []
    empty_ingredients: list[str] = []
    by_creator: dict[str, int] = {}
    for creator_id, url in pairs:
        row = by_url.get(url)
        if row is None:
            missing.append(url)
            continue
        recipe = build_mvp_mobile_recipe(row)
        if len(recipe["ingredients"]) < 1:
            empty_ingredients.append(url)
            continue
        exported.append(recipe)
        by_creator[creator_id] = by_creator.get(creator_id, 0) + 1

    exported.sort(key=lambda item: (item.get("creator_id") or "", item.get("title") or ""))
    text = json.dumps(exported, ensure_ascii=False, separators=(",", ":")) + "\n"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    if also_public:
        APP_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
        APP_PUBLIC.write_text(text, encoding="utf-8")

    return {
        "catalog_urls": len(pairs),
        "exported": len(exported),
        "missing_from_db": len(missing),
        "empty_ingredients": len(empty_ingredients),
        "by_creator": by_creator,
        "path": str(out),
        "public_path": str(APP_PUBLIC) if also_public else None,
        "missing_sample": missing[:10],
        "empty_sample": empty_ingredients[:10],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export MVP recipes into mobile catalog.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--no-public", action="store_true")
    args = parser.parse_args()
    result = export_mvp_mobile_catalog(
        recipes_db=args.db,
        out_path=args.out,
        also_public=not args.no_public,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
