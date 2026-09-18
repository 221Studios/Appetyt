"""Tests for Sam The Cooking Guy catalog discovery."""

from __future__ import annotations

import unittest

from scripts.discover_sam_catalog import classify_sam_url, discover_sam_catalog


SITEMAP = """<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://www.thecookingguy.com/recipes/green-chile-cheeseburger-pasta</loc></url>
  <url><loc>https://thecookingguy.com/recipes/coconut-jasmine-rice</loc></url>
  <url><loc>https://www.thecookingguy.com/about</loc></url>
  <url><loc>https://www.thecookingguy.com/recipes</loc></url>
</urlset>
"""


class DiscoverSamCatalogTests(unittest.TestCase):
    def test_classify_recipe_paths(self):
        kind, _ = classify_sam_url(
            "https://www.thecookingguy.com/recipes/green-chile-cheeseburger-pasta/"
        )
        self.assertEqual(kind, "recipe")
        kind, reason = classify_sam_url("https://www.thecookingguy.com/about")
        self.assertEqual(kind, "rejected")
        self.assertEqual(reason, "not_recipe_path")

    def test_discover_from_sitemap(self):
        catalog = discover_sam_catalog(fetch=lambda _url: SITEMAP)
        self.assertEqual(catalog["creator_id"], "sam_the_cooking_guy")
        self.assertEqual(catalog["recipe_count"], 2)
        urls = {row["source_url"] for row in catalog["recipes"]}
        self.assertIn(
            "https://www.thecookingguy.com/recipes/green-chile-cheeseburger-pasta/",
            urls,
        )


if __name__ == "__main__":
    unittest.main()
