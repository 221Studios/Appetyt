"""Tests for Joshua Weissman catalog discovery."""

from __future__ import annotations

import unittest

from scripts.discover_weissman_catalog import (
    PAGE_PARAM,
    classify_weissman_url,
    discover_weissman_catalog,
)


PAGE1 = f"""
<html><body>
<a href="/recipes/mayonnaise-recipe">Mayo</a>
<a href="/recipes/best-ever-chewy-brownies-recipe">Brownies</a>
<a href="/recipe-collection/lazy-pasta">Collection</a>
<a href="/about">About</a>
<div class="w-pagination-wrapper">
  <a href="?{PAGE_PARAM}=2" aria-label="Next Page">Next</a>
</div>
</body></html>
"""

PAGE2 = """
<html><body>
<a href="https://www.joshuaweissman.com/recipes/kfc-sauce-copycat-recipe">KFC</a>
</body></html>
"""


class DiscoverWeissmanCatalogTests(unittest.TestCase):
    def test_classify_recipe_paths(self):
        kind, _ = classify_weissman_url(
            "https://www.joshuaweissman.com/recipes/mayonnaise-recipe"
        )
        self.assertEqual(kind, "recipe")
        kind, reason = classify_weissman_url(
            "https://www.joshuaweissman.com/recipe-collection/lazy"
        )
        self.assertEqual(kind, "rejected")
        self.assertEqual(reason, "not_recipe_path")

    def test_discover_paginated_listing(self):
        pages = {
            "https://www.joshuaweissman.com/recipes": PAGE1,
            f"https://www.joshuaweissman.com/recipes?{PAGE_PARAM}=2": PAGE2,
        }

        def fetch(url: str) -> str | None:
            return pages.get(url)

        catalog = discover_weissman_catalog(fetch=fetch)
        self.assertEqual(catalog["creator_id"], "joshua_weissman")
        self.assertEqual(catalog["pages_fetched"], 2)
        self.assertEqual(catalog["recipe_count"], 3)
        urls = {row["source_url"] for row in catalog["recipes"]}
        self.assertIn(
            "https://www.joshuaweissman.com/recipes/mayonnaise-recipe",
            urls,
        )
        self.assertIn(
            "https://www.joshuaweissman.com/recipes/kfc-sauce-copycat-recipe",
            urls,
        )


if __name__ == "__main__":
    unittest.main()
