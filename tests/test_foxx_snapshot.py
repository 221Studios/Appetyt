import unittest

from scripts.foxx_snapshot import parse_foxx_page, split_ingredient_line


class FoxxSnapshotTests(unittest.TestCase):
    def test_splits_compact_quantity_line_without_losing_source_text(self):
        parts = split_ingredient_line(
            "300 g cukru 200 ml śmietanki 30% 2-3 łyżeczki masła sól trochę wody"
        )

        self.assertEqual(
            parts,
            [
                "300 g cukru",
                "200 ml śmietanki 30%",
                "2-3 łyżeczki masła sól trochę wody",
            ],
        )

    def test_does_not_split_reference_weight_inside_parentheses(self):
        self.assertEqual(
            split_ingredient_line("300 g (2 szklanki) mąki"),
            ["300 g (2 szklanki) mąki"],
        )

    def test_extracts_ingredients_and_steps_but_not_article_footer(self):
        page = {
            "title": "Kurczak",
            "url": "https://adifoxx.pl/kurczak/",
            "markdown": """
# Kurczak

Krótki opis dania.

**SKŁADNIKI:**
* 400 g kurczaka
* 2–3 łyżki oleju

**PRZYGOTOWANIE:**
Kurczaka pokrój i wymieszaj z olejem.
Smaż do zarumienienia.

## Zobacz również
To nie jest część przepisu.
""",
        }

        parsed = parse_foxx_page(page)

        self.assertEqual(parsed["ingredients"], ["400 g kurczaka", "2–3 łyżki oleju"])
        self.assertEqual(
            parsed["source_steps"],
            ["Kurczaka pokrój i wymieszaj z olejem.", "Smaż do zarumienienia."],
        )
        self.assertNotIn("To nie jest część przepisu.", parsed["source_steps"])

    def test_falls_back_to_structured_ingredients_when_markdown_has_no_sections(self):
        parsed = parse_foxx_page(
            {
                "title": "Prosty przepis",
                "url": "https://adifoxx.pl/prosty-przepis/",
                "markdown": "# Prosty przepis\n\nOpis.",
                "recipe": {"recipeIngredient": ["1 jajko", "100 g mąki"]},
            }
        )

        self.assertEqual(parsed["ingredients"], ["1 jajko", "100 g mąki"])

    def test_prefers_structured_ingredients_over_article_bullets(self):
        parsed = parse_foxx_page(
            {
                "title": "Sos",
                "url": "https://adifoxx.pl/sos/",
                "markdown": """
                **SKŁADNIKI:**
                * 1 g błędnego dodatku z artykułu
                **PRZYGOTOWANIE:**
                Wymieszaj składniki.
                """,
                "recipe": {
                    "recipeIngredient": [
                        "1. SOS: ",
                        "3 łyżki majonezu",
                        "1 łyżeczka musztardy",
                    ]
                },
            }
        )

        self.assertEqual(
            parsed["ingredients"],
            ["3 łyżki majonezu", "1 łyżeczka musztardy"],
        )

    def test_accepts_source_steps_from_supplemental_snapshot(self):
        parsed = parse_foxx_page(
            {
                "title": "Karmel",
                "url": "https://adifoxx.pl/karmel/",
                "recipe": {"recipeIngredient": ["300 g cukru"]},
                "source_steps": ["Podgrzej cukier.", "Dodaj śmietankę."],
            }
        )

        self.assertEqual(parsed["source_steps"], ["Podgrzej cukier.", "Dodaj śmietankę."])


if __name__ == "__main__":
    unittest.main()
