import re

from .models import Creator, Ingredient, Recipe, RecipeIngredient
from .schemas import (
    CreatorOut,
    IngredientOut,
    NutritionOut,
    ProductOut,
    RecipeIngredientOut,
    RecipeSummaryOut,
)
from .staples import staple_for
from .units import normalize_amount

_HTML_TAG = re.compile(r"<[^>]+>")


def display_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = _HTML_TAG.sub(" ", value)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def _price_units(product: object) -> tuple[float | None, float | None]:
    package = normalize_amount(product.package_qty, product.package_unit)
    if package and package[1] == "volume":
        package_ml = package[0]
        price_per_100ml = round(product.price_pln / package_ml * 100, 2) if package_ml > 0 else None
        return None, price_per_100ml
    if package and package[1] == "mass" and package[0] <= 0:
        return None, None
    if package and package[1] == "mass":
        package_g = package[0]
    elif product.package_size_g is not None and product.package_size_g > 0:
        package_g = product.package_size_g
    else:
        return None, None
    price_per_100g = product.price_per_100g
    if price_per_100g is None:
        price_per_100g = round(product.price_pln / package_g * 100, 2)
    return price_per_100g, None


def nutrition(ingredient: Ingredient) -> NutritionOut:
    staple = staple_for(ingredient.id)
    return NutritionOut(
        calories=staple.kcal if staple is not None and staple.kcal is not None else ingredient.kcal_per_100g,
        protein_g=staple.protein
        if staple is not None and staple.protein is not None
        else ingredient.protein_per_100g,
        fat_g=staple.fat if staple is not None and staple.fat is not None else ingredient.fat_per_100g,
        carbs_g=staple.carbs
        if staple is not None and staple.carbs is not None
        else ingredient.carbs_per_100g,
    )


def ingredient_out(ingredient: Ingredient) -> IngredientOut:
    staple = staple_for(ingredient.id)
    name_pl = staple.name_pl if staple is not None else ingredient.name_pl
    return IngredientOut(
        id=ingredient.id,
        name=name_pl or ingredient.name_en,
        name_en=ingredient.name_en,
        name_pl=name_pl,
        nutrition_per_100g=nutrition(ingredient),
        source=ingredient.source_release,
        source_updated_at=ingredient.source_updated_at,
    )


def creator_out(creator: Creator | None) -> CreatorOut | None:
    if creator is None:
        return None
    return CreatorOut(
        id=creator.id,
        name=creator.name,
        category=creator.category,
        primary_source=creator.primary_source,
        website_url=creator.website_url,
        youtube_url=creator.youtube_url,
        language=creator.language,
        recipe_count=len(creator.recipes),
    )


def recipe_ingredient_out(line: RecipeIngredient) -> RecipeIngredientOut:
    return RecipeIngredientOut(
        ingredient_id=line.ingredient_id,
        name=line.name,
        amount_value=line.amount_value,
        amount_text=line.amount_text,
        unit=line.unit,
        amount_g=line.amount_g,
        scalable=line.scalable,
        section_title=line.section_title,
        ingredient=ingredient_out(line.ingredient) if line.ingredient else None,
    )


def recipe_summary(recipe: Recipe) -> RecipeSummaryOut:
    return RecipeSummaryOut(
        id=recipe.id,
        title=display_text(recipe.title) or recipe.title,
        subtitle=display_text(recipe.subtitle),
        category=recipe.category,
        cuisine=recipe.cuisine,
        creator=creator_out(recipe.creator),
        source_url=recipe.source_url,
        duration_minutes=recipe.duration_minutes,
        servings=recipe.servings,
        nutrition_per_serving=NutritionOut(
            calories=recipe.calories_per_serving,
            protein_g=recipe.protein_per_serving,
            fat_g=recipe.fat_per_serving,
            carbs_g=recipe.carbs_per_serving,
        ),
        ingredient_count=len(recipe.ingredients),
        ingredient_names=[line.name for line in recipe.ingredients],
    )


def product_out(product: object, store: str) -> ProductOut:
    price_per_100g, price_per_100ml = _price_units(product)
    return ProductOut(
        id=product.id,
        store=store,
        name=product.name,
        brand=product.brand,
        package_qty=product.package_qty,
        package_unit=product.package_unit,
        price_pln=product.price_pln,
        is_estimate=True,
        price_per_100g=price_per_100g,
        price_per_100ml=price_per_100ml,
        source_url=product.source_url,
        source_updated_at=product.source_updated_at,
    )
