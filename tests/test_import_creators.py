import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.import_creators import import_creators, load_seed


class SeedTests(unittest.TestCase):
    def test_seed_has_four_categories(self):
        rows = load_seed()
        self.assertGreaterEqual(len(rows), 100)
        ids = {row[0] for row in rows}
        self.assertNotIn("joanna_krupa", ids)
        self.assertNotIn("strictly_dumpling", ids)
        self.assertNotIn("gienek_z_plutycz", ids)
        cats = {row[2] for row in rows}
        counts = {cat: 0 for cat in cats}
        for row in rows:
            counts[row[2]] += 1
        self.assertEqual(len(counts), 4)
        self.assertEqual(
            cats,
            {
                "influencer_pl",
                "chef_pl",
                "influencer_global",
                "chef_global",
            },
        )

    def test_website_source_requires_url(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "creators.json"
            path.write_text(
                json.dumps(
                    [
                        {
                            "id": "broken",
                            "name": "Broken",
                            "category": "chef_global",
                            "primary_source": "website",
                            "website_url": None,
                            "youtube_url": None,
                            "youtube_channel_id": None,
                            "language": "en",
                        }
                    ]
                ),
                encoding="utf-8",
            )
            with self.assertRaises(ValueError):
                load_seed(path)


class ImportTests(unittest.TestCase):
    def test_import_replaces_table(self):
        with tempfile.TemporaryDirectory() as tmp:
            data_dir = Path(tmp)
            db_path = data_dir / "recipes.sqlite"
            n = import_creators(db_path=db_path)
            conn = sqlite3.connect(db_path)
            try:
                count = conn.execute("SELECT COUNT(*) FROM creators").fetchone()[0]
                gordon = conn.execute(
                    "SELECT website_url, youtube_url, youtube_channel_id FROM creators WHERE creator_id = ?",
                    ("gordon_ramsay",),
                ).fetchone()
            finally:
                conn.close()
            self.assertEqual(count, n)
            self.assertEqual(
                gordon,
                (
                    "https://gordonramsay.com",
                    None,
                    "UCIEv3lZ_tNXHzL3ox-_uUGQ",
                ),
            )
            import_creators(db_path=db_path)
            conn = sqlite3.connect(db_path)
            try:
                again = conn.execute("SELECT COUNT(*) FROM creators").fetchone()[0]
            finally:
                conn.close()
            self.assertEqual(again, n)


if __name__ == "__main__":
    unittest.main()
