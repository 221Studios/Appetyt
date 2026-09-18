"""Archive creator rows out of the canonical recipes corpus."""

from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.archive_creator_recipes import archive_creator_recipes

SCHEMA = """
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
);
"""


def _seed(db: Path) -> None:
    conn = sqlite3.connect(db)
    conn.executescript(SCHEMA)
    conn.executemany(
        """
        INSERT INTO recipes (
            source_url, creator_id, title, prep_minutes, cook_minutes,
            total_minutes, recipe_yield, ingredients_json, source_steps_json, fetched_at
        ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, ?, NULL, ?)
        """,
        [
            (
                "https://adifoxx.pl/a",
                "foxx_gotuje",
                "A",
                '["1 cebula"]',
                "2026-01-01T00:00:00Z",
            ),
            (
                "https://adifoxx.pl/b",
                "foxx_gotuje",
                "B",
                '["2 jajka"]',
                "2026-01-02T00:00:00Z",
            ),
            (
                "https://other.example/c",
                "jamie_oliver",
                "C",
                '["salt"]',
                "2026-01-03T00:00:00Z",
            ),
        ],
    )
    conn.commit()
    conn.close()


class ArchiveCreatorRecipesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.db = self.root / "recipes.sqlite"
        self.archive_dir = self.root / "archive"
        _seed(self.db)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_moves_creator_rows_to_archive_and_clears_canonical(self):
        result = archive_creator_recipes(
            "foxx_gotuje",
            recipes_db=self.db,
            archive_dir=self.archive_dir,
        )
        self.assertEqual(result["archived"], 2)
        self.assertTrue(Path(result["archive_path"]).is_file())

        conn = sqlite3.connect(self.db)
        left = conn.execute(
            "SELECT creator_id, COUNT(*) FROM recipes GROUP BY creator_id"
        ).fetchall()
        conn.close()
        self.assertEqual(left, [("jamie_oliver", 1)])

        arch = sqlite3.connect(result["archive_path"])
        urls = {
            row[0]
            for row in arch.execute(
                "SELECT source_url FROM recipes WHERE creator_id=?",
                ("foxx_gotuje",),
            )
        }
        arch.close()
        self.assertEqual(
            urls,
            {"https://adifoxx.pl/a", "https://adifoxx.pl/b"},
        )

    def test_second_run_is_noop_when_canonical_already_empty(self):
        archive_creator_recipes(
            "foxx_gotuje",
            recipes_db=self.db,
            archive_dir=self.archive_dir,
        )
        second = archive_creator_recipes(
            "foxx_gotuje",
            recipes_db=self.db,
            archive_dir=self.archive_dir,
        )
        self.assertEqual(second["archived"], 0)
        self.assertIsNone(second["archive_path"])

        conn = sqlite3.connect(self.db)
        self.assertEqual(
            conn.execute(
                "SELECT COUNT(*) FROM recipes WHERE creator_id=?",
                ("foxx_gotuje",),
            ).fetchone()[0],
            0,
        )
        conn.close()


if __name__ == "__main__":
    unittest.main()
