import unittest

from scripts.html_recipe import (
    parse_description_recipe,
    parse_html_recipe,
    parse_markdown_recipe,
)

FOXX_MD = """
# Kurczak w sosie musztardowym

Krótki wstęp i zaproszenie na film.

## Składniki

- 600 g udek z kurczaka
- 2 łyżki musztardy Dijon
- 1 cebula
- sól, pieprz

## Przygotowanie

Smaż kurczaka i zalej sosem.
"""

WPRM_HTML = """
<html><head><title>Zupa pomidorowa | Blog</title></head>
<body>
<h1>Zupa pomidorowa</h1>
<ul>
  <li class="wprm-recipe-ingredient">400 g pomidorów</li>
  <li class="wprm-recipe-ingredient">1 cebula</li>
  <li class="wprm-recipe-ingredient">sól</li>
</ul>
</body></html>
"""

HEADING_HTML = """
<html><h1>Pancakes</h1>
<h2>Składniki</h2>
<ul>
  <li>200 g mąki</li>
  <li>2 jajka</li>
  <li>300 ml mleka</li>
</ul>
<h2>Przygotowanie</h2>
<ul><li>Subskrybuj kanał</li></ul>
</html>
"""

YT_DESC = """
Dziś carbonara.

Składniki:
- 200 g spaghetti
- 100 g guanciale
- 2 żółtka

Przygotowanie:
gotuj makaron.
"""


class HtmlRecipeTests(unittest.TestCase):
    def test_markdown_foxx_style(self):
        recipe = parse_markdown_recipe(FOXX_MD, "https://foxxgotuje.pl/kurczak")
        self.assertEqual(recipe["title"], "Kurczak w sosie musztardowym")
        self.assertGreaterEqual(len(recipe["ingredients"]), 3)
        self.assertTrue(any("kurczaka" in x for x in recipe["ingredients"]))
        self.assertFalse(any("Smaż" in x for x in recipe["ingredients"]))

    def test_wprm_html(self):
        recipe = parse_html_recipe(WPRM_HTML, "https://example.com/zupa")
        self.assertEqual(recipe["title"], "Zupa pomidorowa")
        self.assertEqual(len(recipe["ingredients"]), 3)

    def test_heading_list_skips_subscribe(self):
        recipe = parse_html_recipe(HEADING_HTML, "https://example.com/pancakes")
        self.assertEqual(recipe["title"], "Pancakes")
        self.assertEqual(recipe["ingredients"], ["200 g mąki", "2 jajka", "300 ml mleka"])

    def test_youtube_description(self):
        recipe = parse_description_recipe(
            YT_DESC,
            "https://www.youtube.com/watch?v=abc",
            title_hint="Carbonara",
        )
        self.assertEqual(recipe["title"], "Carbonara")
        self.assertGreaterEqual(len(recipe["ingredients"]), 3)
        self.assertFalse(any("gotuj" in x.lower() for x in recipe["ingredients"]))

    def test_rejects_nav_only(self):
        html = "<html><h1>Hi</h1><ul><li>Home</li></ul></html>"
        self.assertIsNone(parse_html_recipe(html, "https://example.com/x"))


if __name__ == "__main__":
    unittest.main()
