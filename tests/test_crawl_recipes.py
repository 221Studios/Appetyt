import unittest
from unittest.mock import patch

from scripts.crawl_recipes import (
    looks_like_recipe_url,
    parse_sitemap_xml,
    rank_urls,
    recipe_quality,
    sitemap_urls_from_robots,
    skip_creator_ids,
    website_creators,
)

INDEX_XML = """<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-recipes.xml</loc></sitemap>
</sitemapindex>
"""

URLSET_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/recipes/soup</loc></url>
  <url><loc>https://example.com/przepis/zupa</loc></url>
</urlset>
"""


class SitemapTests(unittest.TestCase):
    def test_index_and_urlset(self):
        kind, locs = parse_sitemap_xml(INDEX_XML)
        self.assertEqual(kind, "index")
        self.assertEqual(locs, ["https://example.com/sitemap-recipes.xml"])
        kind, locs = parse_sitemap_xml(URLSET_XML)
        self.assertEqual(kind, "urlset")
        self.assertEqual(len(locs), 3)

    def test_robots_sitemap_line(self):
        urls = sitemap_urls_from_robots(
            "User-agent: *\nSitemap: https://example.com/sitemap.xml\n"
        )
        self.assertEqual(urls, ["https://example.com/sitemap.xml"])

    def test_recipe_urls_rank_first(self):
        ranked = rank_urls(
            [
                "https://example.com/about",
                "https://example.com/recipes/soup",
            ]
        )
        self.assertTrue(looks_like_recipe_url(ranked[0]))
        self.assertEqual(ranked[0], "https://example.com/recipes/soup")

    def test_pick_falls_back_when_few_recipe_paths(self):
        from scripts.crawl_recipes import pick_candidates

        pages = [
            "https://example.com/zupa-pomidorowa",
            "https://example.com/tag/soup",
            "https://example.com/",
        ]
        picked = pick_candidates(pages)
        self.assertEqual(picked, ["https://example.com/zupa-pomidorowa"])


class CreatorFilterTests(unittest.TestCase):
    def test_skips_gap_sites(self):
        skip = skip_creator_ids()
        self.assertIn("alice_waters", skip)
        self.assertIn("joanna_krupa", skip)
        ids = {row[0] for row in website_creators()}
        self.assertNotIn("alice_waters", ids)
        self.assertIn("jamie_oliver", ids)
        self.assertNotIn("smaker", ids)
        self.assertNotIn("epicurious", ids)
        self.assertNotIn("tasty", ids)
        self.assertNotIn("seonkyoung_longest", ids)
        self.assertNotIn("bake_and_taste", ids)
        self.assertNotIn("mateusz_gessler", ids)


class CrawlTests(unittest.TestCase):
    def test_saves_only_json_ld_recipes(self):
        from pathlib import Path
        import tempfile

        from scripts.crawl_recipes import crawl_creator

        soup_html = """
        <script type="application/ld+json">
        {"@type":"Recipe","name":"Soup","recipeIngredient":["1 onion","salt"]}
        </script>
        """
        about_html = "<html><body>about</body></html>"

        def fake_fetch(url: str, timeout: int = 30):
            if url.endswith("robots.txt"):
                return "Sitemap: https://example.com/sitemap.xml\n"
            if url.endswith("sitemap.xml"):
                return URLSET_XML
            if url.endswith("/recipes/soup"):
                return soup_html
            return about_html

        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "recipes.sqlite"
            with patch("scripts.crawl_recipes.fetch_text", side_effect=fake_fetch):
                result = crawl_creator(
                    "jamie_oliver",
                    "https://example.com/recipes/all",
                    limit=2,
                    db_path=db_path,
                    delay_secs=0,
                )
            self.assertEqual(result["saved"], 1)
            self.assertGreaterEqual(result["skipped_ld"], 1)

            with patch("scripts.crawl_recipes.fetch_text", side_effect=fake_fetch):
                again = crawl_creator(
                    "jamie_oliver",
                    "https://example.com/recipes/all",
                    limit=2,
                    db_path=db_path,
                    delay_secs=0,
                )
            self.assertEqual(again["saved"], 0)
            self.assertGreaterEqual(again["skipped_exist"], 1)


class QualityTests(unittest.TestCase):
    def test_rejects_one_ingredient(self):
        self.assertEqual(
            recipe_quality({"title": "Soup", "ingredients": ["onion"]}),
            "few_ingredients",
        )
        self.assertIsNone(
            recipe_quality({"title": "Soup", "ingredients": ["1 onion", "salt"]})
        )


if __name__ == "__main__":
    unittest.main()
