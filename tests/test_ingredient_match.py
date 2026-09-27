import unittest

from scripts.ingredient_match import (
    ingredients_match_exact,
    normalize_ingredient_line,
    normalize_ingredient_list,
)


class IngredientMatchTests(unittest.TestCase):
    def test_normalize_collapses_whitespace(self):
        self.assertEqual(normalize_ingredient_line("  1 cup   flour\n"), "1 cup flour")

    def test_exact_match_same_order(self):
        a = ["1 cup flour", "2 eggs"]
        b = ["1 cup flour", "2 eggs"]
        self.assertTrue(ingredients_match_exact(a, b)["match"])

    def test_order_matters(self):
        a = ["1 cup flour", "2 eggs"]
        b = ["2 eggs", "1 cup flour"]
        result = ingredients_match_exact(a, b)
        self.assertFalse(result["match"])
        self.assertEqual(result["first_diff"]["index"], 0)

    def test_whitespace_only_difference_ok(self):
        a = ["1 cup  flour"]
        b = ["1 cup flour"]
        self.assertTrue(ingredients_match_exact(a, b)["match"])

    def test_empty_lines_dropped(self):
        self.assertEqual(normalize_ingredient_list(["a", "  ", "b"]), ["a", "b"])


if __name__ == "__main__":
    unittest.main()
