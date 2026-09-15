from pathlib import Path

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session

from alembic import command
from alembic.config import Config
from app.config import get_settings
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
        seed_database(session, tmp_path)
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
