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


def test_matching_and_ingredient_search_are_domain_endpoints(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    matches = client.get("/api/v1/recipes/match?ingredient_ids=900000001,900000002").json()
    assert matches[0]["id"] == "carbonara-test"
    assert matches[0]["matched_ingredients"] == 2
    ingredients = client.get("/api/v1/ingredients?q=szpinak").json()
    assert ingredients["total"] == 1
    assert ingredients["items"][0]["name"] == "szpinak baby"


def test_store_catalogs_are_separate_from_product_tables(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    stores = client.get("/api/v1/stores").json()
    assert [store["slug"] for store in stores] == ["frisco", "auchan", "carrefour"]
    products = client.get("/api/v1/stores/frisco/products?ingredient_id=900000001").json()
    assert products["total"] == 1
    assert products["items"][0]["store"] == "frisco"
