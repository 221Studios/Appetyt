"""Turn a crawled recipe row into a backend-ready Appetyt recipe."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from scripts.cooking_amounts import to_grams, default_amount_g
from scripts.map_recipe_line import map_recipe_name
from scripts.recipe_line import operational_steps, parse_ingredient_line, parse_servings, recipe_id

ROOT = Path(__file__).resolve().parents[1]
INGREDIENTS_DB = ROOT / "data" / "ingredients.sqlite"

CATEGORY_HINTS = (
    ("makaron", "Makarony", "Włoska"),
    ("pasta", "Makarony", "Włoska"),
    ("risotto", "Makarony", "Włoska"),
    ("pizza", "Pieczywo", "Włoska"),
    ("curry", "Dania jednogarnkowe", "Azjatycka"),
    ("soup", "Zupy", None),
    ("zupa", "Zupy", None),
    ("cake", "Desery", None),
    ("ciasto", "Desery", None),
    ("cookie", "Desery", None),
    ("salad", "Sałatki", None),
    ("salat", "Sałatki", None),
    ("breakfast", "Śniadania", "Domowa"),
    ("owsian", "Śniadania", "Domowa"),
    ("chicken", "Mięsa", None),
    ("kurczak", "Mięsa", None),
    ("beef", "Mięsa", None),
    ("steak", "Mięsa", None),
    ("fish", "Ryby", None),
    ("salmon", "Ryby", None),
)


def duration_minutes(row: dict) -> int:
    total = row.get("total_minutes")
    if total:
        return int(total)
    prep = row.get("prep_minutes") or 0
    cook = row.get("cook_minutes") or 0
    combined = int(prep) + int(cook)
    return combined if combined > 0 else 30


def category_and_cuisine(title: str) -> tuple[str, str | None]:
    lowered = title.lower()
    for needle, category, cuisine in CATEGORY_HINTS:
        if needle in lowered:
            return category, cuisine
    return "Dania", None


def _nutrition_for_lines(lines: list[dict], servings: int, nutrients: dict[int, tuple]) -> dict:
    kcal = protein = fat = carbs = 0.0
    used = 0
    for line in lines:
        ingredient_id = line.get("ingredient_id")
        grams = line.get("amount_g")
        if grams is None:
            grams = to_grams(line.get("name") or "", line.get("amount_value"), line.get("unit"))
        if ingredient_id not in nutrients or grams is None:
            continue
        n = nutrients[ingredient_id]
        factor = grams / 100.0
        kcal += (n[0] or 0) * factor
        protein += (n[1] or 0) * factor
        fat += (n[2] or 0) * factor
        carbs += (n[3] or 0) * factor
        used += 1
    if used == 0 or servings <= 0:
        return {
            "calories_per_serving": None,
            "protein_per_serving": None,
            "fat_per_serving": None,
            "carbs_per_serving": None,
        }
    return {
        "calories_per_serving": round(kcal / servings, 1),
        "protein_per_serving": round(protein / servings, 1),
        "fat_per_serving": round(fat / servings, 1),
        "carbs_per_serving": round(carbs / servings, 1),
    }
    if used == 0 or servings <= 0:
        return {
            "calories_per_serving": None,
            "protein_per_serving": None,
            "fat_per_serving": None,
            "carbs_per_serving": None,
        }
    return {
        "calories_per_serving": round(kcal / servings, 1),
        "protein_per_serving": round(protein / servings, 1),
        "fat_per_serving": round(fat / servings, 1),
        "carbs_per_serving": round(carbs / servings, 1),
    }


def load_nutrients(db_path: Path | None = None) -> dict[int, tuple]:
    path = db_path or INGREDIENTS_DB
    if not path.exists():
        return {}
    conn = sqlite3.connect(path)
    try:
        rows = conn.execute(
            "SELECT ingredient_id, kcal_per_100g, protein, fat, carbs FROM ingredients"
        ).fetchall()
    finally:
        conn.close()
    return {row[0]: row[1:] for row in rows}


def build_app_recipe(row: dict, nutrients: dict[int, tuple] | None = None) -> dict:
    raw_ingredients = row.get("ingredients")
    if isinstance(raw_ingredients, str):
        raw_ingredients = json.loads(raw_ingredients)
    source_steps = row.get("source_steps")
    if isinstance(source_steps, str):
        source_steps = json.loads(source_steps or "[]")
    lines = []
    mapped = 0
    for index, raw in enumerate(raw_ingredients or []):
        parsed = parse_ingredient_line(str(raw))
        ingredient_id = map_recipe_name(parsed["name"])
        if ingredient_id is not None:
            mapped += 1
        amount_g = to_grams(str(raw), parsed["amount_value"], parsed["unit"]) or to_grams(
            parsed["name"], parsed["amount_value"], parsed["unit"]
        )
        amount_g = default_amount_g(parsed["name"], str(raw), amount_g, ingredient_id)
        lines.append(
            {
                "ingredient_id": ingredient_id,
                "name": parsed["name"][:240],
                "amount_value": parsed["amount_value"],
                "amount_text": parsed["amount_text"][:120],
                "unit": parsed["unit"],
                "amount_g": amount_g,
                "scalable": True,
                "sort_order": index,
            }
        )
    servings = parse_servings(row.get("recipe_yield")) or 4
    table = nutrients if nutrients is not None else load_nutrients()
    nutrition = _nutrition_for_lines(lines, servings, table)
    title = (row.get("title") or "Przepis").strip()[:240]
    category, cuisine = category_and_cuisine(title)
    source_url = row["source_url"]
    return {
        "id": recipe_id(row.get("creator_id"), source_url),
        "title": title,
        "subtitle": None,
        "category": category,
        "cuisine": cuisine,
        "creator_id": row.get("creator_id"),
        "source_url": source_url,
        "source_updated_at": row.get("fetched_at"),
        "duration_minutes": duration_minutes(row),
        "servings": servings,
        **nutrition,
        "ingredients": lines,
        "steps": operational_steps(source_steps),
        "source_steps": source_steps or [],
        "mapped_count": mapped,
        "ingredient_count": len(lines),
        "mapped_ratio": (mapped / len(lines)) if lines else 0.0,
    }


def is_app_ready(
    recipe: dict,
    min_mapped_ratio: float = 0.4,
    min_mapped_count: int = 2,
    max_ingredients: int = 40,
) -> bool:
    """Luźny próg eksportu (ratio mapowania). Nie mylić z ``completeness_verdict``
    (**przepis kompletny**: kroki, USDA, gramy, pełna wycena ≥1 sklep)."""
    count = recipe["ingredient_count"]
    if count < 2 or count > max_ingredients:
        return False
    if recipe["mapped_count"] < min_mapped_count:
        return False
    return recipe["mapped_ratio"] >= min_mapped_ratio
