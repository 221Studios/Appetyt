import unittest

from scripts.ingredient_sections import group_ingredient_lines, ingredient_structure


class IngredientSectionTests(unittest.TestCase):
    def test_preserves_recipe_parts_for_recipe_and_shopping_list(self):
        lines = [
            "BUNS",
            "2 burger buns",
            "PATTY",
            "500g ground beef",
            "SAUCE",
            "3 tablespoons mayonnaise",
        ]

        self.assertEqual(
            group_ingredient_lines(lines),
            [
                {"title": "BUNS", "source_indexes": [1], "items": ["2 burger buns"]},
                {"title": "PATTY", "source_indexes": [3], "items": ["500g ground beef"]},
                {
                    "title": "SAUCE",
                    "source_indexes": [5],
                    "items": ["3 tablespoons mayonnaise"],
                },
            ],
        )

    def test_keeps_ungrouped_ingredients_in_an_implicit_group(self):
        self.assertEqual(
            group_ingredient_lines(["2 eggs", "100g flour"]),
            [{"title": None, "source_indexes": [0, 1], "items": ["2 eggs", "100g flour"]}],
        )

    def test_does_not_treat_bare_ingredient_names_as_sections(self):
        self.assertEqual(
            group_ingredient_lines(["olive oil", "salt", "1 lemon"]),
            [{"title": None, "source_indexes": [0, 1, 2], "items": ["olive oil", "salt", "1 lemon"]}],
        )

    def test_ignores_crawler_chrome_and_instruction_prose(self):
        structure = ingredient_structure(
            [
                "SAUCE",
                "2 tbsp mayonnaise",
                "For US cup measures, use the toggle at the top of the ingredients list.",
                "recipeData.ingredients = value.split(',').map(ingredient => ingredient.trim());",
                "case 'Cuisine':",
            ]
        )
        self.assertEqual(structure["groups"], [
            {"title": "SAUCE", "source_indexes": [1], "items": ["2 tbsp mayonnaise"]},
        ])
        self.assertEqual(
            [item["text"] for item in structure["ignored"]],
            [
                "For US cup measures, use the toggle at the top of the ingredients list.",
                "recipeData.ingredients = value.split(',').map(ingredient => ingredient.trim());",
                "case 'Cuisine':",
            ],
        )


if __name__ == "__main__":
    unittest.main()
