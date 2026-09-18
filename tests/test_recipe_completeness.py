"""External seam: completeness_verdict — przepis kompletny vs incomplete + reasons."""

from __future__ import annotations

import unittest

from scripts.recipe_completeness import completeness_verdict


def _complete_recipe(**overrides):
    base = {
        "source_steps": ["Pokrój cebulę.", "Smaż 5 minut."],
        "source_ingredient_count": 2,
        "lines": [
            {
                "name": "cebula",
                "ingredient_id": 170000,
                "amount_g": 150.0,
                "stores_with_product": ["frisco", "auchan"],
            },
            {
                "name": "olej",
                "ingredient_id": 171033,
                "amount_g": 10.0,
                "stores_with_product": ["frisco"],
            },
        ],
        "nutrition": {
            "calories_total": 400.0,
            "calories_per_serving": 200.0,
            "protein_per_serving": 5.0,
            "fat_per_serving": 10.0,
            "carbs_per_serving": 20.0,
        },
    }
    base.update(overrides)
    return base


class CompletenessVerdictTests(unittest.TestCase):
    def test_complete_recipe_has_no_reasons(self):
        result = completeness_verdict(_complete_recipe())
        self.assertTrue(result["complete"])
        self.assertEqual(result["reasons"], [])

    def test_missing_source_steps_is_incomplete(self):
        result = completeness_verdict(_complete_recipe(source_steps=[]))
        self.assertFalse(result["complete"])
        self.assertIn("missing_source_steps", result["reasons"])

    def test_unmapped_usda_line_is_incomplete(self):
        recipe = _complete_recipe()
        recipe["lines"][1]["ingredient_id"] = None
        result = completeness_verdict(recipe)
        self.assertFalse(result["complete"])
        self.assertTrue(
            any(r.startswith("unmapped_usda:") for r in result["reasons"]),
            result["reasons"],
        )

    def test_missing_grams_is_incomplete(self):
        recipe = _complete_recipe()
        recipe["lines"][0]["amount_g"] = None
        result = completeness_verdict(recipe)
        self.assertFalse(result["complete"])
        self.assertTrue(
            any(r.startswith("missing_grams:") for r in result["reasons"]),
            result["reasons"],
        )

    def test_no_single_store_covers_all_lines(self):
        recipe = _complete_recipe(
            lines=[
                {
                    "name": "cebula",
                    "ingredient_id": 170000,
                    "amount_g": 150.0,
                    "stores_with_product": ["frisco"],
                },
                {
                    "name": "olej",
                    "ingredient_id": 171033,
                    "amount_g": 10.0,
                    "stores_with_product": ["auchan"],
                },
            ]
        )
        result = completeness_verdict(recipe)
        self.assertFalse(result["complete"])
        self.assertIn("no_full_store_coverage", result["reasons"])

    def test_line_count_mismatch_vs_source(self):
        result = completeness_verdict(
            _complete_recipe(source_ingredient_count=3)
        )
        self.assertFalse(result["complete"])
        self.assertIn("line_count_mismatch", result["reasons"])

    def test_missing_nutrition_totals_or_per_serving(self):
        recipe = _complete_recipe()
        recipe["nutrition"]["calories_total"] = None
        result = completeness_verdict(recipe)
        self.assertFalse(result["complete"])
        self.assertIn("missing_nutrition_calories_total", result["reasons"])

    def test_is_app_ready_ratio_gate_is_not_this_verdict(self):
        """Loose is_app_ready must not be confused with przepis kompletny."""
        from scripts.app_recipe import is_app_ready

        # Intentionally incomplete for completeness_verdict (no steps, no stores)
        # but would pass a zero-threshold is_app_ready-shaped dict.
        loose = {
            "ingredient_count": 2,
            "mapped_count": 2,
            "mapped_ratio": 1.0,
        }
        self.assertTrue(is_app_ready(loose, min_mapped_ratio=0.4, min_mapped_count=2))
        strict = completeness_verdict(
            {
                "source_steps": [],
                "source_ingredient_count": 2,
                "lines": [
                    {
                        "name": "a",
                        "ingredient_id": 1,
                        "amount_g": 1.0,
                        "stores_with_product": [],
                    },
                    {
                        "name": "b",
                        "ingredient_id": 2,
                        "amount_g": 1.0,
                        "stores_with_product": [],
                    },
                ],
                "nutrition": {
                    "calories_total": 1.0,
                    "calories_per_serving": 1.0,
                    "protein_per_serving": 0.0,
                    "fat_per_serving": 0.0,
                    "carbs_per_serving": 0.0,
                },
            }
        )
        self.assertFalse(strict["complete"])
        self.assertIn("missing_source_steps", strict["reasons"])
        self.assertIn("no_full_store_coverage", strict["reasons"])


if __name__ == "__main__":
    unittest.main()
