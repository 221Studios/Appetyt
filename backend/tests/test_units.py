from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.costs import cost_for_store
from app.models import Base, FriscoProduct, Ingredient, Recipe, RecipeIngredient
from app.serializers import product_out


def test_litre_is_volume_in_cost_and_product_contract() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(id=1, name_en="Milk", source_release="fixture")
        product = FriscoProduct(
            id="milk-litre",
            name="Milk",
            package_qty=1,
            package_unit="litre",
            package_size_g=None,
            price_pln=4,
            ingredient_id=1,
        )
        recipe = Recipe(
            id="recipe",
            title="Recipe",
            category="Test",
            source_url="https://example.com/recipe",
            duration_minutes=1,
            servings=1,
        )
        recipe.ingredients = [
            RecipeIngredient(
                ingredient_id=1,
                name="milk",
                amount_value=250,
                amount_text="250 ml",
                unit="ml",
                sort_order=0,
            )
        ]
        session.add_all([ingredient, product, recipe])
        session.commit()

        result = cost_for_store(session, recipe, "frisco")

    line = result.lines[0]
    assert line.usage_cost_pln == 1
    assert line.product is not None
    assert line.product.price_per_100g is None
    assert line.product.price_per_100ml == 0.4


def test_zero_mass_package_has_no_unit_price() -> None:
    product = SimpleNamespace(
        id="zero-package",
        name="Invalid product",
        brand=None,
        package_qty=0,
        package_unit="g",
        package_size_g=None,
        price_pln=4,
        price_per_100g=None,
        source_url=None,
        source_updated_at=None,
    )

    result = product_out(product, "frisco")

    assert result.price_per_100g is None
    assert result.price_per_100ml is None
