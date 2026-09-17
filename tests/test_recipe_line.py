import unittest

from scripts.recipe_line import (
    operational_steps,
    parse_ingredient_line,
    parse_servings,
    recipe_id,
)


class ParseLineTests(unittest.TestCase):
    def test_grams_strips_parenthetical(self):
        line = parse_ingredient_line("250g sirloin steak (ideally 1.5cm thick)")
        self.assertEqual(line["amount_value"], 250.0)
        self.assertEqual(line["unit"], "g")
        self.assertEqual(line["name"], "sirloin steak")
        self.assertEqual(line["amount_text"], "250 g")

    def test_count_with_size_adjective(self):
        line = parse_ingredient_line("1 large onion")
        self.assertEqual(line["amount_value"], 1.0)
        self.assertEqual(line["unit"], "szt")
        self.assertEqual(line["name"], "onion")

    def test_unicode_fraction_and_ml(self):
        onion = parse_ingredient_line("½ a small red onion")
        self.assertEqual(onion["amount_value"], 0.5)
        self.assertEqual(onion["unit"], "szt")
        cream = parse_ingredient_line("250ml double cream or crème fraîche")
        self.assertEqual(cream["amount_value"], 250.0)
        self.assertEqual(cream["unit"], "ml")

    def test_tablespoons_are_not_pieces(self):
        line = parse_ingredient_line("3 tablespoons butter")
        self.assertEqual(line["amount_value"], 3.0)
        self.assertEqual(line["unit"], "łyżka")
        self.assertEqual(line["name"], "butter")

    def test_ascii_half_teaspoon_salt(self):
        line = parse_ingredient_line("1/2 teaspoon salt")
        self.assertEqual(line["amount_value"], 0.5)
        self.assertEqual(line["unit"], "łyżeczka")
        self.assertEqual(line["name"], "salt")

    def test_mixed_fraction_cups(self):
        line = parse_ingredient_line("1 1/2 cups water")
        self.assertEqual(line["amount_value"], 1.5)
        self.assertEqual(line["unit"], "cup")
        self.assertEqual(line["name"], "water")
        line = parse_ingredient_line("1.5kg mixed apples")
        self.assertEqual(line["amount_value"], 1500.0)
        self.assertEqual(line["unit"], "g")


class ServingsAndIdTests(unittest.TestCase):
    def test_servings(self):
        self.assertEqual(parse_servings("4"), 4)
        self.assertEqual(parse_servings("2 servings"), 2)
        self.assertEqual(parse_servings("Serves 6"), 6)
        self.assertIsNone(parse_servings(None))

    def test_recipe_id_is_stable_and_short(self):
        first = recipe_id("jamie_oliver", "https://www.jamieoliver.com/recipes/a")
        second = recipe_id("jamie_oliver", "https://www.jamieoliver.com/recipes/a")
        other = recipe_id("jamie_oliver", "https://www.jamieoliver.com/recipes/b")
        self.assertEqual(first, second)
        self.assertNotEqual(first, other)
        self.assertLessEqual(len(first), 120)


class OperationalStepsTests(unittest.TestCase):
    def test_does_not_copy_literary_prose(self):
        prose = (
            "Pull the fat off the sirloin, finely slice the fat and place it in a "
            "large cold non-stick frying pan. Put on a medium-high heat to render."
        )
        steps = operational_steps([prose])
        self.assertEqual(steps[0]["step_number"], 1)
        self.assertNotIn("Pull the fat off the sirloin", steps[0]["instructions"])
        self.assertLessEqual(len(steps[0]["title"]), 48)

    def test_empty_falls_back_to_source_link_step(self):
        steps = operational_steps([])
        self.assertEqual(len(steps), 1)
        self.assertIn("źródle", steps[0]["instructions"].lower())


if __name__ == "__main__":
    unittest.main()
