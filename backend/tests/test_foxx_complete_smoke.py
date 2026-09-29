"""Smoke: Foxx recipes without source servings stay out of complete export."""

from __future__ import annotations

import json
from pathlib import Path


def test_complete_foxx_smoke_in_api(tmp_path: Path) -> None:
    root = Path(__file__).resolve().parents[2]
    report = json.loads(
        (root / "data" / "foxx_gotuje_completeness_report.json").read_text(
            encoding="utf-8"
        )
    )
    complete = [row for row in report["recipes"] if row.get("complete")]
    assert not complete

    # Prefer committed export helper output if present; else build via script module.
    from scripts.export_complete_recipes import export_complete_from_report

    export_complete_from_report(
        recipes_db=root / "data" / "recipes.sqlite",
        report_path=root / "data" / "foxx_gotuje_completeness_report.json",
        out_path=tmp_path / "app_recipes.json",
    )
    exported = json.loads((tmp_path / "app_recipes.json").read_text(encoding="utf-8"))
    assert exported == []
