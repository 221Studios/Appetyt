import unittest

from scripts.cooking_amounts import to_grams, to_pieces


class CookingAmountTests(unittest.TestCase):
    def test_half_onion_is_half_of_medium(self):
        whole = to_grams("onion", 1, "szt")
        half = to_grams("red onion", 0.5, "szt")
        self.assertEqual(whole, 110)
        self.assertEqual(half, 55)

    def test_small_onion_is_lighter(self):
        self.assertEqual(to_grams("small onion", 1, "szt"), 70)

    def test_cup_of_water(self):
        self.assertEqual(to_grams("water", 1.5, "cup"), 360)

    def test_pieces_for_shopping(self):
        self.assertEqual(to_pieces(0.5, "szt"), 0.5)
        self.assertIsNone(to_pieces(55, "g"))


if __name__ == "__main__":
    unittest.main()
