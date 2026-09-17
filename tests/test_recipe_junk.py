import json
import tempfile
import unittest
from pathlib import Path

from scripts.crawl_recipes import recipe_quality
from scripts.recipe_junk import cleanup_recipes, junk_reason
from scripts.schema_recipe import save_recipe


def _recipe(**kwargs):
    base = {
        "title": "Zupa pomidorowa",
        "source_url": "https://example.com/przepis/zupa",
        "prep_minutes": None,
        "cook_minutes": None,
        "total_minutes": None,
        "recipe_yield": None,
        "ingredients": ["400 g pomidorów", "1 cebula"],
        "source_steps": [],
    }
    base.update(kwargs)
    return base


class JunkReasonTests(unittest.TestCase):
    def test_keeps_real_cookie_recipe(self):
        self.assertIsNone(
            junk_reason(
                _recipe(
                    title="Chocolate Chip Cookies",
                    source_url="https://sallysbakingaddiction.com/chocolate-chip-cookies/",
                    ingredients=["2 cups flour", "1 cup butter", "1 cup sugar"],
                )
            )
        )
        self.assertIsNone(
            recipe_quality(
                {
                    "title": "Chocolate Chip Cookies",
                    "ingredients": ["2 cups flour", "1 cup butter"],
                }
            )
        )

    def test_rejects_privacy_and_footer_pages(self):
        self.assertEqual(
            junk_reason(
                _recipe(
                    title="Polityka prywatności i plików cookies",
                    ingredients=["a", "b", "c"],
                )
            ),
            "junk_title",
        )
        self.assertEqual(
            junk_reason(
                _recipe(
                    title="Bez laktozy",
                    source_url="https://aniastarmach.pl/przepisy/dieta/bez-laktozy/",
                    ingredients=["a", "b", "c"],
                )
            ),
            "listing_url",
        )

    def test_rejects_html_and_huge_ingredient_lists(self):
        self.assertEqual(
            junk_reason(
                _recipe(ingredients=['<div class="ingredients-content">', "</div>"])
            ),
            "html_ingredients",
        )
        self.assertEqual(
            junk_reason(_recipe(ingredients=[f"item {i}" for i in range(80)])),
            "too_many_ingredients",
        )


class CleanupTests(unittest.TestCase):
    def test_deletes_junk_and_keeps_one_duplicate(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "recipes.sqlite"
            save_recipe(_recipe(), creator_id="owsiana", db_path=db)
            save_recipe(
                _recipe(
                    title="Polityka prywatności i plików cookies",
                    source_url="https://owsiana.pl/przepisy/diety/weganskie/",
                    ingredients=["x", "y", "z"],
                ),
                creator_id="owsiana",
                db_path=db,
            )
            body = {
                "title": "Spicy Enoki Mushroom",
                "ingredients": ["1 pack enoki", "1 tbsp soy sauce"],
            }
            save_recipe(
                {**_recipe(**body), "source_url": "https://seonkyounglongest.com/a"},
                creator_id="seonkyoung_longest",
                db_path=db,
            )
            save_recipe(
                {**_recipe(**body), "source_url": "https://seonkyounglongest.com/b"},
                creator_id="seonkyoung_longest",
                db_path=db,
            )
            result = cleanup_recipes(db)
            self.assertEqual(result["deleted_junk"], 1)
            self.assertEqual(result["deleted_dupes"], 1)
            import sqlite3

            conn = sqlite3.connect(db)
            try:
                titles = [
                    row[0]
                    for row in conn.execute("SELECT title FROM recipes ORDER BY title")
                ]
            finally:
                conn.close()
            self.assertEqual(titles, ["Spicy Enoki Mushroom", "Zupa pomidorowa"])


if __name__ == "__main__":
    unittest.main()
