from pathlib import Path

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session

from alembic import command
from alembic.config import Config
from app.config import get_settings
from app.models import Recipe
from app.seed import seed_database


def test_schema_and_seed_are_repeatable(tmp_path: Path, monkeypatch) -> None:
    database_url = f"sqlite:///{tmp_path / 'migration.sqlite'}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    engine = create_engine(database_url)
    with Session(engine) as session:
        seed_database(session, tmp_path)
    with Session(engine) as session:
        recipe = session.get(Recipe, "szakszuka-test")
        assert recipe is not None
        recipe.ingredients = [
            line for line in recipe.ingredients if line.name not in {"czosnek", "papryka wędzona"}
        ]
        recipe.steps[0].instructions = "Podgrzej pomidory z czosnkiem i przyprawami, aż sos lekko zgęstnieje."
        session.commit()
    with Session(engine) as session:
        seed_database(session, tmp_path)
        recipe = session.get(Recipe, "szakszuka-test")
        assert recipe is not None
        assert {line.name for line in recipe.ingredients} >= {"czosnek", "papryka wędzona"}
        assert "papryką wędzoną" in recipe.steps[0].instructions
    tables = set(inspect(engine).get_table_names())
    assert {
        "recipes",
        "recipe_ingredients",
        "recipe_steps",
        "ingredients",
        "creators",
        "store_catalogs",
        "products_frisco",
        "products_auchan",
        "products_carrefour",
    } <= tables
    with engine.connect() as connection:
        assert connection.exec_driver_sql("SELECT COUNT(*) FROM recipes").scalar() == 5
        assert connection.exec_driver_sql("SELECT COUNT(*) FROM store_catalogs").scalar() == 3
    get_settings.cache_clear()


def test_seed_imports_crawled_app_recipes(tmp_path: Path, monkeypatch) -> None:
    database_url = f"sqlite:///{tmp_path / 'crawled.sqlite'}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    (tmp_path / "app_recipes.json").write_text(
        """
        [{
          "id": "crawled-steak",
          "title": "Steak sandwich",
          "subtitle": null,
          "category": "Mięsa",
          "cuisine": null,
          "creator_id": "missing_creator",
          "source_url": "https://example.com/steak",
          "duration_minutes": null,
          "servings": null,
          "calories_per_serving": 400,
          "protein_per_serving": 30,
          "fat_per_serving": 20,
          "carbs_per_serving": 10,
          "ingredients": [
            {
              "ingredient_id": 170000,
              "name": "onion",
              "amount_value": 1,
              "amount_text": "1 szt",
              "unit": "szt",
              "scalable": true,
              "sort_order": 0
            }
          ],
          "steps": [
            {
              "step_number": 1,
              "title": "Smaż cebulę",
              "instructions": "Szczegóły w źródle przepisu.",
              "duration_minutes": null
            }
          ]
        }]
        """,
        encoding="utf-8",
    )
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    engine = create_engine(database_url)
    with Session(engine) as session:
        seed_database(session, tmp_path)
        recipe = session.get(Recipe, "crawled-steak")
        assert recipe is not None
        assert recipe.creator_id is None
        assert recipe.duration_minutes is None
        assert recipe.servings is None
        assert recipe.ingredients[0].ingredient_id is None
        assert recipe.ingredients[0].name == "onion"
        assert session.query(Recipe).count() == 6
    get_settings.cache_clear()
