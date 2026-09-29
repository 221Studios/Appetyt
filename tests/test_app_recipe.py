import unittest

from scripts.app_recipe import build_app_recipe, duration_minutes, is_app_ready


class AppRecipeTests(unittest.TestCase):
    def test_preserves_ingredient_sections_on_lines_and_recipe(self):
        recipe = build_app_recipe(
            {
                "source_url": "https://example.com/burger",
                "title": "Burger",
                "ingredients": [
                    "BUNS",
                    "2 burger buns",
                    "PATTY",
                    "300 g ground beef",
                    "SAUCE",
                    "2 tbsp mayonnaise",
                ],
                "source_steps": [],
            },
            nutrients={},
        )
        self.assertEqual(
            [group["title"] for group in recipe["ingredient_sections"]],
            ["BUNS", "PATTY", "SAUCE"],
        )
        self.assertEqual(
            [line["section_title"] for line in recipe["ingredients"]],
            ["BUNS", "PATTY", "SAUCE"],
        )
        self.assertEqual([line["name"] for line in recipe["ingredients"]], [
            "burger buns",
            "ground beef",
            "mayonnaise",
        ])

    def test_missing_source_time_is_not_invented(self):
        self.assertIsNone(
            duration_minutes(
                {"prep_minutes": None, "cook_minutes": None, "total_minutes": None}
            )
        )
        self.assertIsNone(
            duration_minutes(
                {"prep_minutes": 10, "cook_minutes": 20, "total_minutes": None}
            )
        )

        recipe = build_app_recipe(
            {
                "source_url": "https://example.com/no-time",
                "title": "Recipe without source time",
                "ingredients": ["1 onion", "1 tomato"],
                "source_steps": [],
            },
            nutrients={},
        )
        self.assertIsNone(recipe["duration_minutes"])

    def test_missing_source_servings_is_not_invented(self):
        recipe = build_app_recipe(
            {
                "source_url": "https://example.com/no-yield",
                "title": "Recipe without yield",
                "recipe_yield": None,
                "ingredients": ["1 onion", "1 tomato"],
                "source_steps": [],
            },
            nutrients={
                170000: (100.0, 10.0, 5.0, 20.0),
                170457: (80.0, 2.0, 1.0, 18.0),
            },
        )
        self.assertIsNone(recipe["servings"])
        self.assertIsNone(recipe["calories_per_serving"])
        self.assertIsNone(recipe["protein_per_serving"])
        self.assertIsNone(recipe["fat_per_serving"])
        self.assertIsNone(recipe["carbs_per_serving"])

    def test_maps_lines_and_keeps_source_url(self):
        recipe = build_app_recipe(
            {
                "source_url": "https://www.jamieoliver.com/recipes/steak-sandwich/",
                "creator_id": "jamie_oliver",
                "title": "Grogu's Steak sandwich",
                "total_minutes": 14,
                "recipe_yield": "2",
                "ingredients": [
                    "250g sirloin steak (ideally 1.5cm thick)",
                    "1 large onion",
                    "2 teaspoons American mustard",
                    "4 slices of nice bread (50g each)",
                    "50g provolone or fontina cheese",
                ],
                "source_steps": [
                    "Pull the fat off the sirloin, finely slice the fat and place it in a pan."
                ],
                "fetched_at": "2026-09-16T00:00:00Z",
            },
            nutrients={170831: (250.0, 26.0, 15.0, 0.0), 170000: (40.0, 1.1, 0.1, 9.3)},
        )
        self.assertTrue(is_app_ready(recipe))
        self.assertEqual(recipe["servings"], 2)
        self.assertEqual(recipe["duration_minutes"], 14)
        self.assertEqual(recipe["source_url"], "https://www.jamieoliver.com/recipes/steak-sandwich/")
        ids = {line["ingredient_id"] for line in recipe["ingredients"]}
        self.assertIn(170831, ids)
        self.assertIn(170000, ids)
        self.assertNotIn("Pull the fat off the sirloin", recipe["steps"][0]["instructions"])
        self.assertEqual(
            recipe["source_steps"],
            ["Pull the fat off the sirloin, finely slice the fat and place it in a pan."],
        )
        onion = next(line for line in recipe["ingredients"] if "onion" in line["name"])
        self.assertEqual(onion["amount_g"], 150)
        self.assertGreater(recipe["calories_per_serving"], 300)

    def test_unmapped_recipe_is_app_ready_when_threshold_is_zero(self):
        recipe = build_app_recipe(
            {
                "source_url": "https://example.com/x",
                "creator_id": "x",
                "title": "Mystery stew",
                "total_minutes": 20,
                "recipe_yield": "2",
                "ingredients": ["glorp", "wooble"],
                "source_steps": [],
            },
            nutrients={},
        )
        self.assertFalse(is_app_ready(recipe))
        self.assertTrue(is_app_ready(recipe, min_mapped_ratio=0, min_mapped_count=0))


if __name__ == "__main__":
    unittest.main()
