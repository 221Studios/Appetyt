import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.recipe_quality_report import render, report
from scripts.schema_recipe import save_recipe


class QualityReportTests(unittest.TestCase):
    def test_flags_aggregator_and_named(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "recipes.sqlite"
            save_recipe(
                {
                    "title": "Soup",
                    "source_url": "https://example.com/soup",
                    "prep_minutes": None,
                    "cook_minutes": None,
                    "total_minutes": None,
                    "recipe_yield": None,
                    "ingredients": ["a", "b", "c"],
                    "source_steps": [],
                },
                creator_id="jamie_oliver",
                db_path=db,
            )
            save_recipe(
                {
                    "title": "Agg",
                    "source_url": "https://smaker.pl/x",
                    "prep_minutes": None,
                    "cook_minutes": None,
                    "total_minutes": None,
                    "recipe_yield": None,
                    "ingredients": ["a", "b"],
                    "source_steps": [],
                },
                creator_id="smaker",
                db_path=db,
            )
            data = report(db)
            self.assertEqual(data["named"], 1)
            self.assertEqual(data["aggregators"], 1)
            self.assertEqual(data["pct_ge2"], 100.0)
            self.assertIn("verdict", data["samples"][0])
            text = render(data)
            self.assertIn("jamie_oliver", text)
            self.assertIn("AGG", text)
            self.assertIn("% z ≥2", text)


if __name__ == "__main__":
    unittest.main()
