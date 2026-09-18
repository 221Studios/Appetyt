"""Tests for Nick DiGiovanni catalog discovery."""

from __future__ import annotations

import unittest

from scripts.discover_nick_catalog import classify_nick_url, discover_nick_catalog


SITEMAP = """<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://nickskitchen.com/recipes/</loc></url>
  <url><loc>https://nickskitchen.com/five-cheese-mac-and-cheese/</loc></url>
  <url><loc>https://www.nickskitchen.com/smashburger-recipe/</loc></url>
  <url><loc>https://nickskitchen.com/videos/30-minute-butter-chicken/</loc></url>
  <url><loc>https://nickskitchen.com/about/</loc></url>
</urlset>
"""


class DiscoverNickCatalogTests(unittest.TestCase):
    def test_classify_root_recipe_posts(self):
        kind, _ = classify_nick_url("https://nickskitchen.com/smashburger-recipe/")
        self.assertEqual(kind, "recipe")
        kind, reason = classify_nick_url(
            "https://nickskitchen.com/videos/30-minute-butter-chicken/"
        )
        self.assertEqual(kind, "rejected")
        self.assertEqual(reason, "video_tip_path")

    def test_discover_from_post_sitemap(self):
        catalog = discover_nick_catalog(fetch=lambda _url: SITEMAP)
        self.assertEqual(catalog["creator_id"], "nick_digiovanni")
        self.assertEqual(catalog["recipe_count"], 2)
        urls = {row["source_url"] for row in catalog["recipes"]}
        self.assertIn("https://nickskitchen.com/five-cheese-mac-and-cheese/", urls)
        self.assertIn("https://nickskitchen.com/smashburger-recipe/", urls)


if __name__ == "__main__":
    unittest.main()
