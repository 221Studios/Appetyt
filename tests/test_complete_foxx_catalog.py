"""Batch: cały katalog Foxxa → canonical + raport kompletności."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.complete_foxx_catalog import complete_foxx_catalog
from tests.test_complete_foxx_recipe import FOXX_ZUPA_HTML

ZUPA_URL = "https://adifoxx.pl/prosta-i-wypasiona-zupa-czosnkowa-foxx-gotuje/"
OTHER_URL = "https://adifoxx.pl/fake-other-recipe/"


class CompleteFoxxCatalogTests(unittest.TestCase):
    def test_report_lists_each_url_with_status(self):
        catalog = {
            "creator_id": "foxx_gotuje",
            "recipes": [
                {"source_url": ZUPA_URL},
                {"source_url": OTHER_URL},
            ],
        }

        def fake_fetch(url: str) -> str:
            if url == ZUPA_URL:
                return FOXX_ZUPA_HTML
            return "<html><h1>X</h1><body>brak składników</body></html>"

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            db = root / "recipes.sqlite"
            report_path = root / "report.json"
            cat_path = root / "catalog.json"
            cat_path.write_text(json.dumps(catalog), encoding="utf-8")
            with patch("scripts.complete_foxx_recipe.fetch_html", side_effect=fake_fetch):
                report = complete_foxx_catalog(
                    catalog_path=cat_path,
                    recipes_db=db,
                    report_path=report_path,
                )
            self.assertEqual(report["creator_id"], "foxx_gotuje")
            self.assertEqual(report["total"], 2)
            self.assertEqual(report["complete"], 1)
            self.assertEqual(report["incomplete"], 1)
            by_url = {row["source_url"]: row for row in report["recipes"]}
            self.assertTrue(by_url[ZUPA_URL]["complete"])
            self.assertFalse(by_url[OTHER_URL]["complete"])
            self.assertTrue(by_url[OTHER_URL]["reasons"])
            self.assertTrue(report_path.is_file())
            saved = json.loads(report_path.read_text(encoding="utf-8"))
            self.assertEqual(saved["complete"], 1)


if __name__ == "__main__":
    unittest.main()
