from .models import Creator, Ingredient, Recipe, RecipeIngredient
from .schemas import (
    CreatorOut,
    IngredientOut,
    NutritionOut,
    ProductOut,
    RecipeIngredientOut,
    RecipeSummaryOut,
)


def nutrition(ingredient: Ingredient) -> NutritionOut:
    return NutritionOut(
        calories=ingredient.kcal_per_100g,
        protein_g=ingredient.protein_per_100g,
        fat_g=ingredient.fat_per_100g,
        carbs_g=ingredient.carbs_per_100g,
    )


def ingredient_out(ingredient: Ingredient) -> IngredientOut:
    return IngredientOut(
        id=ingredient.id,
        name=ingredient.name_pl or ingredient.name_en,
        name_en=ingredient.name_en,
        name_pl=ingredient.name_pl,
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
        scalable=line.scalable,
        ingredient=ingredient_out(line.ingredient) if line.ingredient else None,
    )


def recipe_summary(recipe: Recipe) -> RecipeSummaryOut:
    return RecipeSummaryOut(
        id=recipe.id,
        title=recipe.title,
        subtitle=recipe.subtitle,
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
    return ProductOut(
        id=product.id,
        store=store,
        name=product.name,
        brand=product.brand,
        package_qty=product.package_qty,
        package_unit=product.package_unit,
        price_pln=product.price_pln,
        price_per_100g=product.price_per_100g,
        source_url=product.source_url,
        source_updated_at=product.source_updated_at,
    )
