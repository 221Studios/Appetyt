"""E2E: one Foxx recipe → przepis kompletny (ingest + map + store + verdict)."""

from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.complete_foxx_recipe import build_foxx_completeness, ingest_foxx_recipe
from scripts.html_recipe import parse_html_recipe, source_steps_from_html
from scripts.recipe_line import parse_ingredient_line

FOXX_ZUPA_HTML = """
<html><head><title>PROSTA I WYPASIONA ZUPA CZOSNKOWA – Foxx Gotuje</title></head>
<body>
<h1>PROSTA I WYPASIONA ZUPA CZOSNKOWA</h1>
<p>SKŁADNIKI:</p>
<ul>
  <li>2-3 główki czosnku (zależnie od wielkości)</li>
  <li>2/3 szklanki śmietanki 30%</li>
  <li>1 szklanka bulionu drobiowego</li>
  <li>3 łyżki posiekanej cebuli</li>
  <li>2 łyżki masła</li>
  <li>6-7 łyżek oliwy</li>
  <li>szczypiorek do dekoracji</li>
  <li>2 małe ziemniaki (lub 1 duży) posiekane w drobną kostkę</li>
  <li>chleb kwadratowy / prostokątny</li>
  <li>sól i pieprz</li>
</ul>
<p>PRZYGOTOWANIE :</p>
<p>1. Na początek zadbaj o to, żeby chleb był suchy.</p>
<p>2. Do garnka dodaj oliwę, masło, ziemniaki, czosnek i cebulę.</p>
<p>3. Smaż na dużym ogniu przez 2 minuty, a następnie przykryj.</p>
<p>4. Usmaż płatki czosnku na złoto.</p>
<p>5. Dodaj bulion i gotuj pod przykryciem.</p>
<p>6. Wydrąż chleb.</p>
<p>7. Dodaj śmietankę, zblenduj i dopraw.</p>
<p>8. Podawaj z płatkami czosnku oraz szczypiorkiem.</p>
<p>Zobacz również</p>
<p>KULE SMAKOWE – Czyli jak zrobić kawior</p>
</body></html>
"""

URL = "https://adifoxx.pl/prosta-i-wypasiona-zupa-czosnkowa-foxx-gotuje/"


class FoxxStepsAndParseTests(unittest.TestCase):
    def test_source_steps_from_przygotowanie(self):
        steps = source_steps_from_html(FOXX_ZUPA_HTML)
        self.assertGreaterEqual(len(steps), 8)
        self.assertTrue(steps[0].startswith("1."))
        self.assertFalse(any("KULE SMAKOWE" in s for s in steps))

    def test_parse_html_keeps_source_steps(self):
        recipe = parse_html_recipe(FOXX_ZUPA_HTML, URL)
        self.assertIsNotNone(recipe)
        assert recipe is not None
        self.assertEqual(len(recipe["ingredients"]), 10)
        self.assertGreaterEqual(len(recipe["source_steps"]), 8)

    def test_range_amount_uses_midpoint(self):
        parsed = parse_ingredient_line("2-3 główki czosnku")
        self.assertEqual(parsed["amount_value"], 2.5)
        self.assertIn("czosnku", parsed["name"])

    def test_unquantified_water_has_explicit_small_default(self):
        payload = build_foxx_completeness(
            {
                "title": "Caramel",
                "source_url": "https://example.com/caramel",
                "ingredients": ["trochę wody", "100 g cukru"],
                "source_steps": ["Gotuj."],
            }
        )
        water = next(line for line in payload["lines"] if "wod" in line["name"])
        self.assertEqual(water["amount_g"], 15.0)

    def test_skips_hard_unmapped_lines(self):
        payload = build_foxx_completeness(
            {
                "title": "Pad Thai",
                "source_url": "https://example.com/pad",
                "recipe_yield": "2 porcje",
                "ingredients": [
                    "200 g mąki pszennej",
                    "100 ml wody",
                    "Nam Prik Pao z tajskiego bazaru którego nie ma w USDA",
                    "opcjonalne liście bananowca na talerz",
                ],
                "source_steps": [],
            }
        )
        self.assertTrue(payload["verdict"]["complete"], payload["verdict"]["reasons"])
        self.assertEqual(payload["source_ingredient_count"], len(payload["lines"]))
        self.assertGreaterEqual(len(payload["lines"]), 2)
        self.assertTrue(any(s.get("skip_reason") for s in payload["skipped_lines"]))
        self.assertEqual(payload["source_steps"][0], "1. Gotuj według źródła przepisu.")


class FoxxCompletenessE2ETests(unittest.TestCase):
    def test_build_completeness_passes_verdict(self):
        recipe = parse_html_recipe(FOXX_ZUPA_HTML, URL)
        assert recipe is not None
        recipe["recipe_yield"] = "4 porcje"
        payload = build_foxx_completeness(recipe)
        self.assertTrue(payload["verdict"]["complete"], payload["verdict"]["reasons"])
        self.assertEqual(payload["source_ingredient_count"], 10)
        self.assertIsNotNone(payload["nutrition"]["calories_total"])
        self.assertIsNotNone(payload["nutrition"]["calories_per_serving"])
        # at least one store covers all lines
        store_sets = [set(line["stores_with_product"]) for line in payload["lines"]]
        common = set.intersection(*store_sets) if store_sets else set()
        self.assertTrue(common)

    def test_missing_source_yield_does_not_invent_servings(self):
        recipe = parse_html_recipe(FOXX_ZUPA_HTML, URL)
        assert recipe is not None
        payload = build_foxx_completeness(recipe)
        self.assertFalse(payload["verdict"]["complete"])
        self.assertIn("missing_nutrition_calories_per_serving", payload["verdict"]["reasons"])
        self.assertIsNotNone(payload["nutrition"]["calories_total"])
        self.assertIsNone(payload["nutrition"]["calories_per_serving"])

    def test_ingest_writes_canonical_row(self):
        import sqlite3
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "recipes.sqlite"
            with patch("scripts.complete_foxx_recipe.fetch_html", return_value=FOXX_ZUPA_HTML):
                result = ingest_foxx_recipe(URL, recipes_db=db)
            self.assertFalse(result["verdict"]["complete"])
            conn = sqlite3.connect(db)
            row = conn.execute(
                "SELECT title, creator_id, ingredients_json, source_steps_json FROM recipes WHERE source_url=?",
                (URL,),
            ).fetchone()
            conn.close()
            self.assertIsNotNone(row)
            self.assertEqual(row[1], "foxx_gotuje")
            self.assertIn("czosnku", row[2])
            self.assertIn("1.", row[3])


if __name__ == "__main__":
    unittest.main()
