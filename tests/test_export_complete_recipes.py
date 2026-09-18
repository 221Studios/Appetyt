"""Export only completeness-passing Foxx recipes for API smoke seed."""

from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.export_complete_recipes import export_complete_from_report


class ExportCompleteRecipesTests(unittest.TestCase):
    def test_exports_only_complete_urls(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            db = root / "recipes.sqlite"
            report_path = root / "report.json"
            out = root / "app_recipes.json"
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
            for url, title in (
                ("https://adifoxx.pl/a/", "Complete"),
                ("https://adifoxx.pl/b/", "Incomplete"),
            ):
                conn.execute(
                    "INSERT INTO recipes VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (
                        url,
                        "foxx_gotuje",
                        title,
                        10,
                        20,
                        30,
                        "2",
                        json.dumps(["1 cebula"]),
                        json.dumps(["1. Smaż."]),
                        "2026-01-01T00:00:00Z",
                    ),
                )
            conn.commit()
            conn.close()
            report_path.write_text(
                json.dumps(
                    {
                        "creator_id": "foxx_gotuje",
                        "recipes": [
                            {
                                "source_url": "https://adifoxx.pl/a/",
                                "complete": True,
                            },
                            {
                                "source_url": "https://adifoxx.pl/b/",
                                "complete": False,
                            },
                        ],
                    }
                ),
                encoding="utf-8",
            )
            fake_payload = {
                "id": "foxx-a",
                "title": "Complete",
                "calories_per_serving": 100.0,
                "mapped_count": 1,
                "mapped_ratio": 1.0,
                "ingredient_count": 1,
                "steps": [{"step_number": 1, "instructions": "x"}],
                "costs": [],
            }
            with patch(
                "scripts.export_complete_recipes.build_app_recipe",
                return_value=fake_payload,
            ), patch(
                "scripts.export_complete_recipes.load_nutrients",
                return_value={},
            ):
                stats = export_complete_from_report(
                    recipes_db=db,
                    report_path=report_path,
                    out_path=out,
                )
            self.assertEqual(stats["complete_urls"], 1)
            self.assertEqual(stats["exported"], 1)
            exported = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(len(exported), 1)
            self.assertEqual(exported[0]["id"], "foxx-a")
            self.assertNotIn("mapped_count", exported[0])


if __name__ == "__main__":
    unittest.main()
