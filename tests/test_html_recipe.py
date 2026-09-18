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

    def test_title_keeps_hyphen_in_name(self):
        html = (
            "<html><h1>15-MINUTOWY POLSKI JAKBY RAMEN – Foxx Gotuje</h1>"
            "<p>SKŁADNIKI:</p>"
            "<p>1 cebula</p><p>2 łyżki oleju</p>"
            "<p>PRZEPIS:</p><p>Smaż cebulę.</p></html>"
        )
        recipe = parse_html_recipe(html, "https://adifoxx.pl/ramen/")
        self.assertIsNotNone(recipe)
        self.assertIn("15-MINUTOWY", recipe["title"])
        self.assertGreaterEqual(len(recipe["ingredients"]), 2)

    def test_section_qty_lines_without_skladniki_heading(self):
        html = """
        <html><h1>IDEALNY LUBELSKI CEBULARZ – Foxx Gotuje</h1>
        <p>FARSZ:</p>
        <p>250 g cebuli posiekanej w grubą kostkę</p>
        <p>2-3 łyżki masła</p>
        <p>CIASTO:</p>
        <p>500 g mąki pszennej typ 500</p>
        <p>125 g wody</p>
        <p>PRZEPIS:</p>
        <p>Wymieszaj farsz i uformuj cebularze.</p>
        </html>
        """
        recipe = parse_html_recipe(html, "https://adifoxx.pl/cebularz/")
        self.assertIsNotNone(recipe)
        self.assertGreaterEqual(len(recipe["ingredients"]), 4)
        self.assertTrue(any("cebuli" in x for x in recipe["ingredients"]))
        self.assertTrue(any("mąki" in x for x in recipe["ingredients"]))
        self.assertFalse(any("Wymieszaj" in x for x in recipe["ingredients"]))

    def test_filters_step_lines_from_ingredients(self):
        html = """
        <html><h1>Panierka – Foxx Gotuje</h1>
        <p>SKŁADNIKI:</p>
        <p>200 g mąki</p>
        <p>1 łyżeczka soli</p>
        <p>Krok 7. Obtaczaj kurczaka w panierce</p>
        <p>PRZEPIS:</p>
        <p>Smaż stripsy.</p>
        </html>
        """
        recipe = parse_html_recipe(html, "https://adifoxx.pl/panierka/")
        self.assertIsNotNone(recipe)
        self.assertTrue(all("Krok" not in x for x in recipe["ingredients"]))

    def test_ignores_skladniki_inside_instruction_sentence(self):
        html = """
        <html><h1>Cubano – Foxx Gotuje</h1>
        <p>65 g mąki</p>
        <p>120 g wody</p>
        <p>2 g drożdży instant</p>
        <p>Wszystkie składniki zblenduj w blenderze.</p>
        <p>PRZEPIS:</p>
        <p>Piecz mięso.</p>
        </html>
        """
        recipe = parse_html_recipe(html, "https://adifoxx.pl/cubano/")
        self.assertIsNotNone(recipe)
        self.assertGreaterEqual(len(recipe["ingredients"]), 3)
        self.assertTrue(any("mąki" in x for x in recipe["ingredients"]))

    def test_splits_dense_ingredient_blob(self):
        html = """
        <html><h1>Krem Snickers – Foxx Gotuje</h1>
        <p>300 g cukru 200 ml śmietanki 30% 2-3 łyżeczki masła</p>
        <p>PRZEPIS:</p>
        <p>Gotuj karmel.</p>
        </html>
        """
        recipe = parse_html_recipe(html, "https://adifoxx.pl/snickers/")
        self.assertIsNotNone(recipe)
        self.assertGreaterEqual(len(recipe["ingredients"]), 3)

    def test_foxx_wp_block_list_without_heading(self):
        html = """
        <html><h1>Makaron test – Foxx Gotuje</h1>
        <ul class="nm-block-list wp-block-list">
          <li>tagliatelle lub pappardelle świeże (do kupienia w marketach</li>
          <li>oliwa</li>
          <li>⅔ szklanki śmietanki 30%</li>
          <li>40 g gorgonzoli</li>
          <li>parmezan lub pecorino romano</li>
        </ul>
        <p>Na patelni rozgrzej oliwę.</p>
        <p>Dodaj śmietankę oraz gorgonzolę.</p>
        </html>
        """
        recipe = parse_html_recipe(html, "https://adifoxx.pl/makaron-test/")
        self.assertIsNotNone(recipe)
        joined = " | ".join(recipe["ingredients"])
        self.assertIn("tagliatelle", joined)
        self.assertIn("oliwa", joined)
        self.assertIn("śmietanki", joined)
        self.assertIn("parmezan", joined)
        self.assertTrue(any("rozgrzej oliwę" in s for s in recipe["source_steps"]))

    def test_skips_newsletter_h1(self):
        html = """
        <html><h1>Get notified about new recipes</h1>
        <h1>Easy Mayonnaise</h1>
        <h2>Ingredients</h2>
        <ul><li>2 large egg yolks</li><li>1 cup oil</li><li>1 Tbsp lemon juice</li></ul>
        </html>
        """
        recipe = parse_html_recipe(html, "https://www.joshuaweissman.com/recipes/mayonnaise-recipe")
        self.assertIsNotNone(recipe)
        self.assertEqual(recipe["title"], "Easy Mayonnaise")


if __name__ == "__main__":
    unittest.main()
