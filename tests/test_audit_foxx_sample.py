"""Tests for Foxx audit sample comparison seam."""

from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.audit_foxx_sample import audit_foxx_sample, compare_recipe
from tests.test_complete_foxx_recipe import FOXX_ZUPA_HTML, URL


class CompareRecipeTests(unittest.TestCase):
    def test_matching_ingredients_and_steps_pass(self):
        canonical = {
            "ingredients": ["1 cebula", "2 łyżki masła"],
            "source_steps": ["1. Smaż."],
        }
        live = {
            "ingredients": ["1 cebula", "2 łyżki masła"],
            "source_steps": ["1. Smaż cebulę."],
        }
        result = compare_recipe(canonical, live)
        self.assertTrue(result["pass"])
        self.assertEqual(result["ingredient_coverage"], 1.0)

    def test_low_coverage_fails(self):
        canonical = {
            "ingredients": ["a", "b", "c", "d"],
            "source_steps": ["1. x"],
        }
        live = {"ingredients": ["a"], "source_steps": ["1. x"]}
        result = compare_recipe(canonical, live)
        self.assertFalse(result["pass"])
        self.assertTrue(any(x.startswith("ingredient_coverage") for x in result["issues"]))


class AuditFoxxSampleTests(unittest.TestCase):
    def test_audits_fixed_sample_against_fetch(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "recipes.sqlite"
            conn = sqlite3.connect(db)
            conn.execute(
                """
                CREATE TABLE recipes (
                    source_url TEXT PRIMARY KEY,
                    creator_id TEXT,
                    title TEXT NOT NULL,
                    prep_minutes INTEGER,
                    cook_minutes INTEGER,
                    total_minutes INTEGER,
                    recipe_yield TEXT,
                    ingredients_json TEXT NOT NULL,
                    source_steps_json TEXT,
                    fetched_at TEXT NOT NULL
                )
                """
            )
            # 10 rows so sample_size=10 works; one real zupa HTML, rest stubs matching themselves
            for i in range(10):
                url = URL if i == 0 else f"https://adifoxx.pl/stub-{i}/"
                title = "ZUPA" if i == 0 else f"Stub {i}"
                if i == 0:
                    ings = json.dumps(
                        [
                            "2-3 główki czosnku (zależnie od wielkości)",
                            "2/3 szklanki śmietanki 30%",
                            "1 szklanka bulionu drobiowego",
                            "3 łyżki posiekanej cebuli",
                            "2 łyżki masła",
                            "6-7 łyżek oliwy",
                            "szczypiorek do dekoracji",
                            "2 małe ziemniaki (lub 1 duży) posiekane w drobną kostkę",
                            "chleb kwadratowy / prostokątny",
                            "sól i pieprz",
                        ]
                    )
                    steps = json.dumps(["1. Na początek zadbaj o to, żeby chleb był suchy."])
                else:
                    ings = json.dumps([f"{i} cebula", f"{i} masło"])
                    steps = json.dumps([f"{i}. Smaż."])
                conn.execute(
                    "INSERT INTO recipes VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (url, "foxx_gotuje", title, None, None, None, None, ings, steps, "2026-01-01T00:00:00Z"),
                )
            conn.commit()
            conn.close()

            def fake_fetch(url: str) -> str:
                if url == URL:
                    return FOXX_ZUPA_HTML
                n = url.rstrip("/").split("-")[-1]
                return (
                    f"<html><h1>Stub {n}</h1><p>SKŁADNIKI:</p><ul>"
                    f"<li>{n} cebula</li><li>{n} masło</li></ul>"
                    f"<p>PRZYGOTOWANIE :</p><p>{n}. Smaż.</p></html>"
                )

            with patch("scripts.audit_foxx_sample.fetch_html", side_effect=fake_fetch):
                report = audit_foxx_sample(recipes_db=db, sample_size=10, seed=18)
            self.assertEqual(report["sample_size"], 10)
            self.assertEqual(report["passed"] + report["failed"], 10)


if __name__ == "__main__":
    unittest.main()
