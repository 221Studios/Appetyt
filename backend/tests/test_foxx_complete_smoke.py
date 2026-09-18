"""Smoke: complete Foxx recipe seeds into API with nutrition + costs."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import get_session
from app.main import app
from app.models import Base
from app.seed import seed_database


def test_complete_foxx_smoke_in_api(tmp_path: Path) -> None:
    root = Path(__file__).resolve().parents[2]
    report = json.loads(
        (root / "data" / "foxx_gotuje_completeness_report.json").read_text(
            encoding="utf-8"
        )
    )
    complete = [row for row in report["recipes"] if row.get("complete")]
    assert complete, "expected at least one complete Foxx recipe in report"

    # Prefer committed export helper output if present; else build via script module.
    from scripts.export_complete_recipes import export_complete_from_report

    export_complete_from_report(
        recipes_db=root / "data" / "recipes.sqlite",
        report_path=root / "data" / "foxx_gotuje_completeness_report.json",
        out_path=tmp_path / "app_recipes.json",
    )
    # seed needs ingredients/creators/store snapshots
    for name in (
        "ingredients.sqlite",
        "creators.json",
        "frisco.sqlite",
        "auchan.sqlite",
        "carrefour.sqlite",
    ):
        src = root / "data" / name
        if src.exists():
            shutil.copy(src, tmp_path / name)

    engine = create_engine(
        f"sqlite:///{tmp_path / 'api.sqlite'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    with session_factory() as session:
        seed_database(session, tmp_path)

    def override_session():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    client = TestClient(app)

    exported = json.loads((tmp_path / "app_recipes.json").read_text(encoding="utf-8"))
    assert len(exported) >= 1
    recipe_id = exported[0]["id"]
    detail = client.get(f"/api/v1/recipes/{recipe_id}")
    assert detail.status_code == 200, detail.text
    payload = detail.json()
    assert payload["nutrition_per_serving"]["calories"] is not None
    assert payload["steps"], "expected operational steps in API"
    # operational steps should not be empty prose dump of whole page
    assert all(step.get("instructions") for step in payload["steps"])
    stores_with_cost = [
        c for c in payload["costs"] if c.get("usage_cost_pln", 0) > 0 or c.get("lines")
    ]
    assert stores_with_cost, "expected costs from at least one store"
    # smoke only — must not imply full catalog
    assert len(exported) == len(complete)
