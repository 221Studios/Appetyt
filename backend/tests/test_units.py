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


def test_cost_chooses_cheapest_product_with_compatible_unit() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(id=1, name_en="Flour", source_release="fixture")
        piece_product = FriscoProduct(
            id="flour-piece",
            name="Flour piece",
            package_qty=1,
            package_unit="szt",
            package_size_g=None,
            price_pln=1,
            ingredient_id=1,
        )
        mass_product = FriscoProduct(
            id="flour-mass",
            name="Flour 500 g",
            package_qty=500,
            package_unit="g",
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
                name="flour",
                amount_value=100,
                amount_text="100 g",
                unit="g",
                sort_order=0,
            )
        ]
        session.add_all([ingredient, piece_product, mass_product, recipe])
        session.commit()

        result = cost_for_store(session, recipe, "frisco")

    line = result.lines[0]
    assert line.product is not None
    assert line.product.id == "flour-mass"
    assert line.usage_cost_pln == 0.8


def test_half_onion_usage_and_whole_onion_basket() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(id=170000, name_en="Onions, raw", source_release="fixture")
        product = FriscoProduct(
            id="onion-each",
            name="Cebula 1 szt",
            package_qty=1,
            package_unit="szt",
            package_size_g=110,
            price_pln=2,
            ingredient_id=170000,
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
                ingredient_id=170000,
                name="red onion",
                amount_value=0.5,
                amount_text="0.5 szt",
                unit="szt",
                amount_g=55,
                sort_order=0,
            )
        ]
        session.add_all([ingredient, product, recipe])
        session.commit()
        result = cost_for_store(session, recipe, "frisco")
    line = result.lines[0]
    assert line.usage_cost_pln == 1
    assert line.basket_cost_pln == 2


def test_olive_oil_skips_snacks_and_uses_bottle() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(id=2, name_en="Olive oil", name_pl="Oliwa z oliwek", source_release="fixture")
        snack = FriscoProduct(
            id="snack",
            name="Bruschetta z pomidorami i oliwą",
            package_qty=0.07,
            package_unit="kg",
            price_pln=3.69,
            ingredient_id=2,
        )
        pesto = FriscoProduct(
            id="pesto",
            name="Pesto zielone z bazylią i oliwą z oliwek",
            package_qty=0.21,
            package_unit="kg",
            price_pln=7.59,
            ingredient_id=2,
        )
        bottle = FriscoProduct(
            id="bottle",
            name="Oliwa z oliwek Extra Virgin",
            package_qty=0.25,
            package_unit="l",
            price_pln=11.89,
            ingredient_id=None,
        )
        recipe = Recipe(id="oil", title="Oil", category="Test", source_url="https://example.com/oil", duration_minutes=1, servings=1)
        recipe.ingredients = [
            RecipeIngredient(ingredient_id=2, name="olive oil", amount_value=2, amount_text="2 tbsp", unit="tbsp", sort_order=0)
        ]
        session.add_all([ingredient, snack, pesto, bottle, recipe])
        session.commit()
        recipe.ingredients[0].ingredient = ingredient
        result = cost_for_store(session, recipe, "frisco")
    line = result.lines[0]
    assert line.product is not None
    assert line.product.id == "bottle"
    assert line.usage_cost_pln is not None
    assert line.usage_cost_pln > 0
    assert line.basket_cost_pln == 11.89


def test_cornstarch_matches_polish_product_name() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(id=3, name_en="Cornstarch", name_pl="Skrobia kukurydziana", source_release="fixture")
        potato = FriscoProduct(
            id="potato",
            name="Skrobia ziemniaczana",
            package_qty=1,
            package_unit="kg",
            price_pln=3.99,
            ingredient_id=None,
        )
        starch = FriscoProduct(
            id="starch",
            name="Skrobia kukurydziana BIO",
            package_qty=250,
            package_unit="g",
            price_pln=7.89,
            ingredient_id=None,
        )
        recipe = Recipe(id="starch-recipe", title="Starch", category="Test", source_url="https://example.com/starch", duration_minutes=1, servings=1)
        recipe.ingredients = [
            RecipeIngredient(ingredient_id=3, name="part cornstarch", amount_value=1, amount_text="1 szt", unit="szt", sort_order=0)
        ]
        session.add_all([ingredient, potato, starch, recipe])
        session.commit()
        recipe.ingredients[0].ingredient = ingredient
        result = cost_for_store(session, recipe, "frisco")
    line = result.lines[0]
    assert line.product is not None
    assert line.product.id == "starch"
    assert "kukurydziana" in line.product.name.lower()
    assert line.basket_cost_pln == 7.89


def test_table_salt_skips_bath_salt() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(id=173468, name_en="Salt, table", name_pl="Sól, stół", source_release="fixture")
        bath = FriscoProduct(
            id="bath",
            name="Sól do kąpieli z glinką",
            package_qty=500,
            package_unit="g",
            price_pln=1,
            ingredient_id=173468,
        )
        kitchen = FriscoProduct(
            id="kitchen",
            name="Sól kuchenna jodowana",
            package_qty=1000,
            package_unit="g",
            price_pln=2.49,
            ingredient_id=None,
        )
        recipe = Recipe(id="salt", title="Salt", category="Test", source_url="https://example.com/salt", duration_minutes=1, servings=1)
        recipe.ingredients = [
            RecipeIngredient(ingredient_id=173468, name="salt", amount_value=5, amount_text="5 g", unit="g", sort_order=0)
        ]
        session.add_all([ingredient, bath, kitchen, recipe])
        session.commit()
        recipe.ingredients[0].ingredient = ingredient
        result = cost_for_store(session, recipe, "frisco")
    line = result.lines[0]
    assert line.product is not None
    assert line.product.id == "kitchen"
    assert line.basket_cost_pln == 2.49


def test_wheat_flour_matches_polish_name() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        ingredient = Ingredient(
            id=168894,
            name_en="Wheat flour, white, all-purpose, enriched, bleached",
            name_pl="Mąka pszenna, biała, uniwersalna, wzbogacona, bielona",
            source_release="fixture",
        )
        flour = FriscoProduct(
            id="flour",
            name="Mąka pszenna (typ 480)",
            package_qty=1000,
            package_unit="g",
            price_pln=4.29,
            ingredient_id=None,
        )
        recipe = Recipe(id="flour", title="Flour", category="Test", source_url="https://example.com/flour", duration_minutes=1, servings=1)
        recipe.ingredients = [
            RecipeIngredient(ingredient_id=168894, name="all-purpose flour", amount_value=100, amount_text="100 g", unit="g", sort_order=0)
        ]
        session.add_all([ingredient, flour, recipe])
        session.commit()
        recipe.ingredients[0].ingredient = ingredient
        result = cost_for_store(session, recipe, "frisco")
    line = result.lines[0]
    assert line.product is not None
    assert "Mąka pszenna" in line.product.name
    assert line.usage_cost_pln == 0.43


def test_staple_overlay_fixes_canola_nutrition_and_name() -> None:
    from app.models import Ingredient
    from app.serializers import ingredient_out
    from app.staples import STAPLES

    ingredient = Ingredient(
        id=748278,
        name_en="Oil, canola",
        name_pl="Olej, canola",
        source_release="fixture",
        kcal_per_100g=None,
        protein_per_100g=None,
        fat_per_100g=None,
        carbs_per_100g=None,
    )
    out = ingredient_out(ingredient)
    assert out.name_pl == STAPLES[748278].name_pl
    assert out.nutrition_per_100g.calories == 884
    assert out.nutrition_per_100g.fat_g == 100

