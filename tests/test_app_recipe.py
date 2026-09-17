import unittest

from scripts.app_recipe import build_app_recipe, is_app_ready


class AppRecipeTests(unittest.TestCase):
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
