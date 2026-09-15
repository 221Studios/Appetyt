import unittest

from scripts.import_usda import kcal_per_100g, row_from_food


class ImportUsdaTests(unittest.TestCase):
    def test_row_maps_kcal_and_macros(self):
        food = {
            "fdcId": 321358,
            "description": "Hummus, commercial",
            "foodNutrients": [
                {"nutrient": {"id": 1003}, "amount": 7.35},
                {"nutrient": {"id": 1004}, "amount": 17.1},
                {"nutrient": {"id": 1005}, "amount": 14.9},
                {"nutrient": {"id": 1008}, "amount": 229},
                {"nutrient": {"id": 1062}, "amount": 960},
            ],
        }
        row = row_from_food(food, "Foundation", "2026-04")
        self.assertEqual(
            row,
            (
                321358,
                "Hummus, commercial",
                None,
                229.0,
                7.35,
                17.1,
                14.9,
                "Foundation",
                "2026-04",
            ),
        )

    def test_kcal_uses_atwater_when_208_missing(self):
        food = {
            "foodNutrients": [
                {"nutrient": {"id": 2048}, "amount": 112},
                {"nutrient": {"id": 2047}, "amount": 106},
            ]
        }
        self.assertEqual(kcal_per_100g(food), 112.0)

    def test_kcal_falls_back_from_kj(self):
        food = {
            "foodNutrients": [
                {"nutrient": {"id": 1062}, "amount": 418.4},
            ]
        }
        self.assertAlmostEqual(kcal_per_100g(food), 100.0)


class GlossaryTests(unittest.TestCase):
    def test_prepare_english_rewrites_fryers(self):
        from scripts.usda_pl_glossary import polish_cleanup, prepare_english

        prepared = prepare_english(
            "Chicken, broilers or fryers, breast, skinless, boneless, meat only, raw"
        )
        self.assertNotIn("fryers", prepared)
        self.assertIn("broiler chicken", prepared)
        self.assertEqual(polish_cleanup("mąka, wszystkożerna"), "Mąka, uniwersalna")


if __name__ == "__main__":
    unittest.main()
