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
from scripts.ingredient_sections import ingredient_structure
from scripts.recipe_line import operational_steps, parse_servings, recipe_id
from scripts.app_recipe import duration_minutes, category_and_cuisine

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_OUT = ROOT / "data" / "mobile_catalog.json"
APP_PUBLIC = ROOT / "cheftable-przepiśnik" / "public" / "recipes.json"
APP_PUBLIC_INDEX = ROOT / "cheftable-przepiśnik" / "public" / "recipes-index.json"
TRANSLATIONS_CACHE = ROOT / "data" / "recipe_translations.json"
RECIPE_IMAGE_CACHE = ROOT / "data" / "recipe_image_cache.jsonl"
NATIVE_LANGUAGE = {
    "foxx_gotuje": "pl",
    "sam_the_cooking_guy": "en",
    "nick_digiovanni": "en",
    "joshua_weissman": "en",
}
INDEX_OVERLAY_KEYS = (
    "title_pl",
    "title_en",
    "subtitle_pl",
    "subtitle_en",
    "category_pl",
    "category_en",
    "cuisine_pl",
    "cuisine_en",
    "ingredients_pl",
    "ingredients_en",
    "image_url",
)


def _load_recipe_translations() -> dict:
    if not TRANSLATIONS_CACHE.exists():
        return {}
    try:
        payload = json.loads(TRANSLATIONS_CACHE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _load_recipe_image_sources() -> dict[str, str]:
    """Load only locally cached image paths for the mobile catalog."""
    if not RECIPE_IMAGE_CACHE.exists():
        return {}
    latest: dict[str, dict] = {}
    try:
        with RECIPE_IMAGE_CACHE.open(encoding="utf-8") as handle:
            for line in handle:
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(item, dict) and isinstance(item.get("id"), str):
                    latest[item["id"]] = item
    except OSError:
        return {}
    return {
        recipe_id: item["image_url"]
        for recipe_id, item in latest.items()
        if (
            item.get("status") == "cached"
            and isinstance(item.get("image_url"), str)
            and item["image_url"].startswith("/recipe-images/")
        )
    }


def _apply_recipe_translations(recipe: dict, translations: dict) -> dict:
    entry = translations.get(recipe["id"])
    if not isinstance(entry, dict):
        return recipe
    for language, suffix in (("pl", "pl"), ("en", "en")):
        localized = entry.get(language)
        if not isinstance(localized, dict):
            continue
        title = localized.get("title")
        subtitle = localized.get("subtitle")
        category = localized.get("category")
        cuisine = localized.get("cuisine")
        ingredients = localized.get("ingredients")
        steps = localized.get("steps")
        if isinstance(title, str) and isinstance(ingredients, list) and isinstance(steps, list):
            recipe[f"title_{suffix}"] = title
            if isinstance(subtitle, str):
                recipe[f"subtitle_{suffix}"] = subtitle
            if isinstance(category, str):
                recipe[f"category_{suffix}"] = category
            if isinstance(cuisine, str):
                recipe[f"cuisine_{suffix}"] = cuisine
            recipe[f"ingredients_{suffix}"] = ingredients
            recipe[f"steps_{suffix}"] = steps
    if "title_pl" in recipe and "title_en" in recipe:
        recipe["translations"] = {
            "pl": {
                "title": recipe["title_pl"],
                "subtitle": recipe.get("subtitle_pl"),
                "category": recipe.get("category_pl"),
                "cuisine": recipe.get("cuisine_pl"),
                "ingredients": recipe["ingredients_pl"],
                "steps": recipe["steps_pl"],
            },
            "en": {
                "title": recipe["title_en"],
                "subtitle": recipe.get("subtitle_en"),
                "category": recipe.get("category_en"),
                "cuisine": recipe.get("cuisine_en"),
                "ingredients": recipe["ingredients_en"],
                "steps": recipe["steps_en"],
            },
        }
    return recipe


def _load_existing_index_translations(path: Path | None = None) -> dict[str, dict]:
    """Keep previously shipped title/ingredient translations across re-export."""
    index_path = Path(path or APP_PUBLIC_INDEX)
    if not index_path.exists():
        return {}
    try:
        payload = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(payload, list):
        return {}
    by_id: dict[str, dict] = {}
    for item in payload:
        if isinstance(item, dict) and isinstance(item.get("id"), str):
            by_id[item["id"]] = item
    return by_id


def _overlay_index_translations(recipe: dict, indexed: dict | None) -> dict:
    if not indexed:
        return recipe
    source_ingredients = recipe.get("ingredients") or []
    for key in INDEX_OVERLAY_KEYS:
        value = indexed.get(key)
        if isinstance(value, str) and value.strip():
            recipe[key] = value.strip()
        elif (
            isinstance(value, list)
            and value
            and all(isinstance(item, str) and item.strip() for item in value)
            and len(value) == len(source_ingredients)
        ):
            recipe[key] = value
    return recipe


def _fill_native_language(recipe: dict) -> dict:
    """Source text is already the creator language; copy it so the UI can select it."""
    language = NATIVE_LANGUAGE.get(recipe.get("creator_id") or "")
    if language not in {"pl", "en"}:
        return recipe
    if not recipe.get(f"title_{language}"):
        recipe[f"title_{language}"] = recipe["title"]
    if recipe.get("category") and not recipe.get(f"category_{language}"):
        recipe[f"category_{language}"] = recipe["category"]
    if recipe.get("cuisine") and not recipe.get(f"cuisine_{language}"):
        recipe[f"cuisine_{language}"] = recipe["cuisine"]
    if recipe.get("subtitle") and not recipe.get(f"subtitle_{language}"):
        recipe[f"subtitle_{language}"] = recipe["subtitle"]
    if not recipe.get(f"ingredients_{language}"):
        recipe[f"ingredients_{language}"] = list(recipe.get("ingredients") or [])
    if not recipe.get(f"steps_{language}"):
        recipe[f"steps_{language}"] = list(recipe.get("steps") or [])
    return recipe


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
    structure = ingredient_structure(ingredients_raw)
    ingredient_sections = [
        {
            "title": group["title"],
            "items": normalize_ingredient_list(group["items"]),
        }
        for group in structure["groups"]
    ]
    ingredients = [
        item
        for group in ingredient_sections
        for item in group["items"]
    ]
    steps = [str(text).strip() for text in source_steps if str(text).strip()]
    if not steps:
        steps = [
            str(item.get("instructions") or item.get("title") or "").strip()
            for item in operational_steps(source_steps)
            if isinstance(item, dict)
        ]
        steps = [text for text in steps if text]
    title = (row["title"] or "Przepis").strip()[:240]
    category, cuisine = category_and_cuisine(title)
    servings = parse_servings(row["recipe_yield"])
    source_url = row["source_url"]
    return {
        "id": recipe_id(row["creator_id"], source_url),
        "title": title,
        "category": category,
        "cuisine": cuisine,
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
        "ingredient_sections": ingredient_sections,
        "steps": steps,
    }


def build_mobile_catalog_index(recipe: dict) -> dict:
    """Return the small record needed by list/search screens.

    Full cooking steps stay in the detail catalog and are loaded only after a
    user opens a recipe. Ingredient lines remain in the index because search
    is expected to find recipes by ingredient.
    """
    keys = (
        "id",
        "title",
        "subtitle",
        "category",
        "cuisine",
        "title_pl",
        "subtitle_pl",
        "category_pl",
        "cuisine_pl",
        "ingredients_pl",
        "title_en",
        "subtitle_en",
        "category_en",
        "cuisine_en",
        "ingredients_en",
        "creator_id",
        "source_url",
        "image_url",
        "duration_minutes",
        "servings",
        "calories_per_serving",
        "protein_per_serving",
        "fat_per_serving",
        "carbs_per_serving",
        "ingredients",
        "ingredient_sections",
    )
    index = {key: recipe[key] for key in keys if key in recipe}
    # The mapper accepts the same shape as the full catalog. Empty steps make
    # translations valid without shipping the large step text in the index.
    index["steps"] = []
    index["steps_pl"] = []
    index["steps_en"] = []
    return index


def export_mvp_mobile_catalog(
    *,
    recipes_db: Path | None = None,
    out_path: Path | None = None,
    also_public: bool = True,
) -> dict:
    db = Path(recipes_db or DEFAULT_DB)
    out = Path(out_path or DEFAULT_OUT)
    pairs = _load_mvp_urls()
    translations = _load_recipe_translations()
    image_sources = _load_recipe_image_sources()
    index_translations = _load_existing_index_translations()
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
        recipe = _apply_recipe_translations(recipe, translations)
        recipe = _overlay_index_translations(recipe, index_translations.get(recipe["id"]))
        recipe = _fill_native_language(recipe)
        image_url = image_sources.get(recipe["id"])
        if image_url:
            recipe["image_url"] = image_url
        if len(recipe["ingredients"]) < 1:
            empty_ingredients.append(url)
            continue
        exported.append(recipe)
        by_creator[creator_id] = by_creator.get(creator_id, 0) + 1

    exported.sort(key=lambda item: (item.get("creator_id") or "", item.get("title") or ""))
    text = json.dumps(exported, ensure_ascii=False, separators=(",", ":")) + "\n"
    index = [build_mobile_catalog_index(recipe) for recipe in exported]
    index_text = json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n"
    index_out = out.with_name(f"{out.stem}_index{out.suffix}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    index_out.write_text(index_text, encoding="utf-8")
    if also_public:
        APP_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
        APP_PUBLIC.write_text(text, encoding="utf-8")
        APP_PUBLIC_INDEX.write_text(index_text, encoding="utf-8")

    return {
        "catalog_urls": len(pairs),
        "exported": len(exported),
        "missing_from_db": len(missing),
        "empty_ingredients": len(empty_ingredients),
        "recipes_with_cached_images": len(image_sources),
        "recipes_with_index_translations": sum(
            1 for recipe in exported if recipe.get("title_pl") and recipe.get("title_en")
        ),
        "by_creator": by_creator,
        "path": str(out),
        "index_path": str(index_out),
        "public_path": str(APP_PUBLIC) if also_public else None,
        "public_index_path": str(APP_PUBLIC_INDEX) if also_public else None,
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
