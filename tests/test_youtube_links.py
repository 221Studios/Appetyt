import unittest

from scripts.youtube_links import extract_page_urls


class ExtractPageUrlsTests(unittest.TestCase):
    def test_keeps_blog_recipe_link(self):
        text = "Przepis: https://kwestiasmaku.com/przepis/zupa\nSubskrybuj"
        self.assertEqual(
            extract_page_urls(text),
            ["https://kwestiasmaku.com/przepis/zupa"],
        )

    def test_drops_youtube_and_social(self):
        text = """
        https://youtu.be/abc123
        https://www.youtube.com/watch?v=abc123
        https://www.instagram.com/p/xyz
        https://www.facebook.com/foo
        https://aniagotuje.pl/rosol
        """
        self.assertEqual(extract_page_urls(text), ["https://aniagotuje.pl/rosol"])

    def test_strips_trailing_punctuation(self):
        text = "Zobacz https://example.com/soup)."
        self.assertEqual(extract_page_urls(text), ["https://example.com/soup"])

    def test_drops_object_replacement_in_url(self):
        text = "https://example.com/przepis\ufffc/zupa"
        self.assertEqual(extract_page_urls(text), ["https://example.com/przepis/zupa"])
