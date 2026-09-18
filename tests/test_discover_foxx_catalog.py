"""Discover public Foxx recipe URLs from listing HTML (no network in unit tests)."""

from __future__ import annotations

import unittest

from scripts.discover_foxx_catalog import (
    classify_foxx_url,
    discover_foxx_catalog,
    extract_foxx_urls,
)

LISTING_HTML = """
<html><body>
  <a href="/blog/page/2/">2</a>
  <a href="https://adifoxx.pl/author/adi/page/2/">author 2</a>
  <a href="/chicken-65-czyli-prosty-i-wypasiony-indyjski-kurczak-deep-fried-foxx-gotuje/">Chicken 65</a>
  <a href="/koszyk/">Koszyk</a>
  <a href="/moje-konto/">Konto</a>
  <a href="/polityka-prywatnosci/">Polityka</a>
  <a href="/regulamin-sklepu/">Regulamin</a>
  <a href="/produkt/foo/">Produkt</a>
  <a href="https://youtube.com/watch?v=x">YT</a>
</body></html>
"""

PAGE2_HTML = """
<html><body>
  <a href="/idealny-lubelski-cebularz-foxx-gotuje/">Cebularz</a>
  <a href="/blog/">blog</a>
</body></html>
"""


class ClassifyFoxxUrlTests(unittest.TestCase):
    def test_recipe_slug(self):
        kind, reason = classify_foxx_url(
            "https://adifoxx.pl/chicken-65-czyli-prosty-foxx-gotuje/"
        )
        self.assertEqual(kind, "recipe")
        self.assertIsNone(reason)

    def test_rejects_cart_account_policy_shop(self):
        for url, code in [
            ("https://adifoxx.pl/koszyk/", "shop_or_account"),
            ("https://adifoxx.pl/moje-konto/", "shop_or_account"),
            ("https://adifoxx.pl/polityka-prywatnosci/", "site_meta"),
            ("https://adifoxx.pl/regulamin-sklepu/", "site_meta"),
            ("https://adifoxx.pl/produkt/foo/", "shop_or_account"),
        ]:
            kind, reason = classify_foxx_url(url)
            self.assertEqual(kind, "rejected", url)
            self.assertEqual(reason, code, url)

    def test_listing_blog_and_author_pages(self):
        for url in [
            "https://adifoxx.pl/blog/",
            "https://adifoxx.pl/blog/page/3/",
            "https://adifoxx.pl/author/adi/",
            "https://adifoxx.pl/author/adi/page/2/",
        ]:
            kind, reason = classify_foxx_url(url)
            self.assertEqual(kind, "listing", url)
            self.assertIsNone(reason)


class ExtractAndDiscoverTests(unittest.TestCase):
    def test_extract_separates_recipes_listings_rejected(self):
        found = extract_foxx_urls(LISTING_HTML, base="https://adifoxx.pl/blog/")
        self.assertIn(
            "https://adifoxx.pl/chicken-65-czyli-prosty-i-wypasiony-indyjski-kurczak-deep-fried-foxx-gotuje/",
            found["recipes"],
        )
        self.assertIn("https://adifoxx.pl/blog/page/2/", found["listings"])
        self.assertIn("https://adifoxx.pl/author/adi/page/2/", found["listings"])
        rejected_urls = {u for u, _ in found["rejected"]}
        self.assertIn("https://adifoxx.pl/koszyk/", rejected_urls)
        self.assertIn("https://adifoxx.pl/polityka-prywatnosci/", rejected_urls)

    def test_discover_walks_listings_and_dedupes(self):
        pages = {
            "https://adifoxx.pl/blog/": LISTING_HTML,
            "https://adifoxx.pl/blog/page/2/": PAGE2_HTML,
            "https://adifoxx.pl/author/adi/page/2/": "<html></html>",
        }

        def fetch(url: str) -> str | None:
            return pages.get(url)

        catalog = discover_foxx_catalog(
            fetch=fetch,
            seeds=["https://adifoxx.pl/blog/"],
        )
        self.assertEqual(catalog["creator_id"], "foxx_gotuje")
        urls = [item["source_url"] for item in catalog["recipes"]]
        self.assertEqual(
            urls,
            [
                "https://adifoxx.pl/chicken-65-czyli-prosty-i-wypasiony-indyjski-kurczak-deep-fried-foxx-gotuje/",
                "https://adifoxx.pl/idealny-lubelski-cebularz-foxx-gotuje/",
            ],
        )
        self.assertEqual(catalog["recipe_count"], 2)
        self.assertGreaterEqual(len(catalog["listing_pages_visited"]), 2)
        self.assertTrue(
            any(r["reason"] == "shop_or_account" for r in catalog["rejected"])
        )


if __name__ == "__main__":
    unittest.main()
