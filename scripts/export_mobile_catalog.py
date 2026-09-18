"""Export the complete mobile catalog with USDA nutrition and store costs.

The runtime API and the mobile bundle use the same cost calculation. This
script seeds a local SQLite runtime from the existing snapshots, serializes
the four requested creators, and keeps source steps and all ingredient lines.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import selectinload

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT / "backend"))

from app.costs import cost_for_store  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import PRODUCT_MODELS, Recipe, RecipeIngredient  # noqa: E402
from app.serializers import ingredient_out, nutrition as ingredient_nutrition  # noqa: E402

CREATOR_IDS = (
    "foxx_gotuje",
    "sam_the_cooking_guy",
    "nick_digiovanni",
    "joshua_weissman",
)
DEFAULT_SOURCE = ROOT / "data" / "app_recipes.json"
DEFAULT_OUTPUT = ROOT / "data" / "mobile_catalog.json"


def _source_steps(recipe: Recipe) -> list[str]:
    if not recipe.source_steps_json:
        return []
    try:
        value = json.loads(recipe.source_steps_json)
    except json.JSONDecodeError:
        return []
    return [str(step) for step in value] if isinstance(value, list) else []


def _ingredient_payload(line: RecipeIngredient) -> dict:
    nutrition = ingredient_nutrition(line.ingredient) if line.ingredient else None
    canonical = ingredient_out(line.ingredient) if line.ingredient else None
    return {
        "ingredient_id": line.ingredient_id,
        "name": line.name,
        "name_pl": canonical.name if canonical else None,
        "amount_value": line.amount_value,
        "amount_text": line.amount_text,
        "unit": line.unit,
        "amount_g": line.amount_g,
        "scalable": line.scalable,
        "sort_order": line.sort_order,
        "nutrition": {
            "kcal_per_100g": nutrition.calories if nutrition else None,
            "protein_per_100g": nutrition.protein_g if nutrition else None,
            "fat_per_100g": nutrition.fat_g if nutrition else None,
            "carbs_per_100g": nutrition.carbs_g if nutrition else None,
            "source": line.ingredient.source_release if line.ingredient else None,
        },
    }


def _recipe_payload(session, recipe: Recipe) -> dict:
    costs = [cost_for_store(session, recipe, store).model_dump(mode="json") for store in PRODUCT_MODELS]
    return {
        "id": recipe.id,
        "title": recipe.title,
        "subtitle": recipe.subtitle,
        "category": recipe.category,
        "cuisine": recipe.cuisine,
        "creator_id": recipe.creator_id,
        "source_url": recipe.source_url,
        "source_updated_at": recipe.source_updated_at.isoformat() if recipe.source_updated_at else None,
        "duration_minutes": recipe.duration_minutes,
        "servings": recipe.servings,
        "calories_per_serving": recipe.calories_per_serving,
        "protein_per_serving": recipe.protein_per_serving,
        "fat_per_serving": recipe.fat_per_serving,
        "carbs_per_serving": recipe.carbs_per_serving,
        "ingredients": [_ingredient_payload(line) for line in recipe.ingredients],
        "steps": [
            {
                "step_number": step.step_number,
                "title": step.title,
                "instructions": step.instructions,
                "duration_minutes": step.duration_minutes,
            }
            for step in recipe.steps
        ],
        "source_steps": _source_steps(recipe),
        "costs": costs,
    }


def export_catalog(source_path: Path, output_path: Path) -> dict:
    """Seeded runtime DB is the source of truth for this export."""
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    with SessionLocal() as session:
        query = (
            select(Recipe)
            .where(Recipe.creator_id.in_(CREATOR_IDS))
            .options(
                selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
                selectinload(Recipe.steps),
            )
            .order_by(Recipe.creator_id, Recipe.title)
        )
        recipes = session.scalars(query).unique().all()
        payload = [_recipe_payload(session, recipe) for recipe in recipes]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")
    by_creator = {creator: sum(recipe["creator_id"] == creator for recipe in payload) for creator in CREATOR_IDS}
    return {"exported": len(payload), "by_creator": by_creator, "path": str(output_path)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    print(json.dumps(export_catalog(args.source, args.out), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
