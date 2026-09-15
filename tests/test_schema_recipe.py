import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.schema_recipe import iso8601_minutes, parse_recipe_html, save_recipe

SIMPLE_HTML = """
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "Tomato soup",
  "url": "https://example.com/tomato-soup",
  "prepTime": "PT10M",
  "cookTime": "PT25M",
  "totalTime": "PT35M",
  "recipeYield": "4",
  "recipeIngredient": ["400 g tomatoes", "1 onion", "salt"],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Chop the onion."},
    {"@type": "HowToStep", "text": "Simmer the tomatoes."}
  ]
}
</script>
</head></html>
"""

GRAPH_HTML = """
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "WebSite", "name": "Blog"},
    {
      "@type": ["Recipe", "NewsArticle"],
      "name": "Pancakes",
      "recipeIngredient": "200 g flour",
      "recipeInstructions": {
        "@type": "HowToSection",
        "name": "Batter",
        "itemListElement": [
          {"@type": "HowToStep", "text": "Mix flour and milk."}
        ]
      }
    }
  ]
}
</script>
</head></html>
"""

NO_RECIPE_HTML = """
<html><head>
<script type="application/ld+json">
{"@type": "Article", "name": "Hello"}
</script>
</head></html>
"""


class DurationTests(unittest.TestCase):
    def test_hours_and_minutes(self):
        self.assertEqual(iso8601_minutes("PT1H30M"), 90)

    def test_days(self):
        self.assertEqual(iso8601_minutes("P1DT2H"), 1560)


class ParseTests(unittest.TestCase):
    def test_simple_recipe(self):
        recipe = parse_recipe_html(SIMPLE_HTML, "https://ignored.example/")
        self.assertEqual(recipe["title"], "Tomato soup")
        self.assertEqual(recipe["source_url"], "https://example.com/tomato-soup")
        self.assertEqual(recipe["prep_minutes"], 10)
        self.assertEqual(recipe["cook_minutes"], 25)
        self.assertEqual(recipe["total_minutes"], 35)
        self.assertEqual(recipe["recipe_yield"], "4")
        self.assertEqual(
            recipe["ingredients"],
            ["400 g tomatoes", "1 onion", "salt"],
        )
        self.assertEqual(
            recipe["source_steps"],
            ["Chop the onion.", "Simmer the tomatoes."],
        )

    def test_graph_and_howto_section(self):
        recipe = parse_recipe_html(GRAPH_HTML, "https://example.com/pancakes")
        self.assertEqual(recipe["title"], "Pancakes")
        self.assertEqual(recipe["ingredients"], ["200 g flour"])
        self.assertEqual(recipe["source_steps"], ["Mix flour and milk."])

    def test_missing_recipe_returns_none(self):
        self.assertIsNone(parse_recipe_html(NO_RECIPE_HTML, "https://example.com/x"))


class SaveTests(unittest.TestCase):
    def test_save_roundtrip(self):
        recipe = parse_recipe_html(SIMPLE_HTML, "https://ignored.example/")
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "recipes.sqlite"
            save_recipe(recipe, creator_id="jamie_oliver", db_path=db_path)
            conn = sqlite3.connect(db_path)
            try:
                row = conn.execute(
                    "SELECT title, creator_id, ingredients_json FROM recipes"
                ).fetchone()
            finally:
                conn.close()
            self.assertEqual(row[0], "Tomato soup")
            self.assertEqual(row[1], "jamie_oliver")
            self.assertEqual(json.loads(row[2]), ["400 g tomatoes", "1 onion", "salt"])


if __name__ == "__main__":
    unittest.main()
