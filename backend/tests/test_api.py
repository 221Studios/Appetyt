from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import get_session
from app.main import app
from app.models import Base
from app.seed import seed_database


def make_client(tmp_path: Path) -> TestClient:
    engine = create_engine(f"sqlite:///{tmp_path / 'test.sqlite'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    with session_factory() as session:
        seed_database(session, tmp_path)

    def override_session():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app)


def test_health_and_fixture_catalog(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    assert client.get("/healthz").json()["status"] == "ok"
    response = client.get("/api/v1/recipes?limit=100")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 5
    assert len(payload["items"]) == 5
    assert all(item["source_url"] for item in payload["items"])
    assert all(item["ingredient_names"] for item in payload["items"])


def test_discover_home_returns_daily_top_five_and_category_sections(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.get("/api/v1/discover/home?date=2026-01-10")
    assert response.status_code == 200
    payload = response.json()

    assert payload["edition_date"] == "2026-01-10"
    assert payload["timezone"] == "Europe/Warsaw"
    assert payload["next_refresh_at"] == "2026-01-11T00:00:00+01:00"
    assert len(payload["top5"]) == 5
    assert len({item["id"] for item in payload["top5"]}) == 5
    assert [section["id"] for section in payload["sections"]] == [
        "cuisine",
        "diet",
        "fast_food",
        "meal_type",
        "other",
    ]
    assert {item["id"] for item in payload["sections"][0]["items"]} == {
        "carbonara-test",
        "szakszuka-test",
        "curry-ciecierzyca-test",
        "penne-pesto-test",
    }
    assert {item["id"] for item in payload["sections"][1]["items"]} == {
        "curry-ciecierzyca-test",
    }
    assert payload["sections"][2]["items"] == []
    assert {item["id"] for item in payload["sections"][3]["items"]} == {
        "carbonara-test",
        "szakszuka-test",
        "curry-ciecierzyca-test",
        "owsianka-jablko-test",
        "penne-pesto-test",
    }


def test_discover_home_changes_edition_at_polish_midnight(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    before = client.get("/api/v1/discover/home?date=2026-01-10").json()
    after = client.get("/api/v1/discover/home?date=2026-01-11").json()

    assert before["edition_date"] != after["edition_date"]
    assert before["next_refresh_at"] == "2026-01-11T00:00:00+01:00"
    assert after["next_refresh_at"] == "2026-01-12T00:00:00+01:00"


def test_recipe_detail_exposes_nutrition_steps_and_three_estimate_costs(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.get("/api/v1/recipes/carbonara-test")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["ingredients"]) == 5
    assert len(payload["steps"]) == 3
    assert payload["nutrition_per_serving"]["calories"] == 620
    assert {cost["store"] for cost in payload["costs"]} == {"frisco", "auchan", "carrefour"}
    assert all(cost["is_estimate"] for cost in payload["costs"])
    assert all(
        line["product"] and line["product"]["is_estimate"]
        for cost in payload["costs"]
        for line in cost["lines"]
    )
    assert client.get("/api/v1/recipes/carbonara-test/costs").status_code == 404


def test_fixture_recipe_details_include_all_explicit_ingredients(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    expected = {
        "carbonara-test": {
            "makaron spaghetti",
            "boczek wędzony",
            "żółtka jaj",
            "ser pecorino",
            "pieprz czarny",
        },
        "szakszuka-test": {
            "pomidory krojone",
            "czosnek",
            "papryka wędzona",
            "jajka",
            "ser feta",
            "szpinak baby",
        },
        "curry-ciecierzyca-test": {
            "ciecierzyca gotowana",
            "pomidory krojone",
            "mleczko kokosowe",
            "ryż biały",
            "szpinak baby",
            "cebula",
            "curry",
        },
        "owsianka-jablko-test": {
            "płatki owsiane",
            "mleko",
            "jabłko",
            "cynamon",
            "jogurt naturalny",
            "masło orzechowe",
        },
        "penne-pesto-test": {
            "makaron penne",
            "świeża bazylia",
            "parmezan",
            "oliwa z oliwek",
            "pieprz czarny",
        },
    }
    for recipe_id, ingredient_names in expected.items():
        response = client.get(f"/api/v1/recipes/{recipe_id}")
        assert response.status_code == 200
        payload = response.json()
        assert ingredient_names == {ingredient["name"] for ingredient in payload["ingredients"]}
        assert len(payload["ingredients"]) == payload["ingredient_count"]
        assert all(line["product"] for cost in payload["costs"] for line in cost["lines"])


def test_ingredient_search_is_a_domain_endpoint(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    ingredients = client.get("/api/v1/ingredients?q=szpinak").json()
    assert ingredients["total"] == 1
    assert ingredients["items"][0]["name"] == "szpinak baby"


def test_pepper_cost_uses_mass_and_excludes_to_taste_quantity(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    carbonara = client.get("/api/v1/recipes/carbonara-test").json()
    pepper = next(
        line for line in carbonara["costs"][0]["lines"] if line["ingredient_name"] == "pieprz czarny"
    )
    assert pepper["required_amount"] == "1 łyżeczka"
    assert pepper["product"]["package_unit"] == "g"
    assert pepper["usage_cost_pln"] == round(pepper["product"]["price_pln"] * 2 / 1000, 2)

    pesto = client.get("/api/v1/recipes/penne-pesto-test").json()
    pepper = next(line for line in pesto["costs"][0]["lines"] if line["ingredient_name"] == "pieprz czarny")
    assert pepper["required_amount"] == "do smaku"
    assert pepper["usage_cost_pln"] is None
    assert pepper["basket_cost_pln"] is None


def test_store_catalogs_are_separate_from_product_tables(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    stores = client.get("/api/v1/stores").json()
    assert [store["slug"] for store in stores] == ["frisco", "auchan", "carrefour"]
    products = client.get("/api/v1/stores/frisco/products?ingredient_id=900000001").json()
    assert products["total"] == 1
    assert products["items"][0]["store"] == "frisco"
    assert products["items"][0]["is_estimate"] is True
    assert products["items"][0]["price_per_100g"] == round(
        products["items"][0]["price_pln"] / products["items"][0]["package_qty"] * 100, 2
    )
    assert products["items"][0]["price_per_100ml"] is None
    liquids = client.get("/api/v1/stores/frisco/products?ingredient_id=900000010").json()
    assert liquids["items"][0]["price_per_100g"] is None
    assert liquids["items"][0]["price_per_100ml"] == round(
        liquids["items"][0]["price_pln"] / liquids["items"][0]["package_qty"] * 100, 2
    )
