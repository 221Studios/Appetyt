import unittest

from scripts.map_recipe_line import map_recipe_name


class MapRecipeNameTests(unittest.TestCase):
    def test_polish_staple(self):
        self.assertEqual(map_recipe_name("cebula"), 170000)
        self.assertEqual(map_recipe_name("mąka pszenna"), 168894)

    def test_polish_recipe_inflections(self):
        self.assertEqual(map_recipe_name("mąki"), 168894)
        self.assertEqual(map_recipe_name("cukru"), 746784)
        self.assertEqual(map_recipe_name("soli"), 173468)
        self.assertEqual(map_recipe_name("soku z cytryny"), 167747)
        self.assertEqual(map_recipe_name("sosu sojowego"), 174277)
        self.assertEqual(map_recipe_name("mielonej wołowiny"), 2514744)
        self.assertEqual(map_recipe_name("jogurtu naturalnego"), 171284)
        self.assertEqual(map_recipe_name("papryki słodkiej"), 170108)
        self.assertEqual(map_recipe_name("papryki wędzonej"), 171329)

    def test_english_staple(self):
        self.assertEqual(map_recipe_name("onion"), 170000)
        self.assertEqual(map_recipe_name("plain flour"), 168894)
        self.assertEqual(map_recipe_name("sirloin steak"), 170831)
        self.assertEqual(map_recipe_name("streaky bacon"), 168277)

    def test_cooking_pantry(self):
        self.assertEqual(map_recipe_name("soy sauce"), 174277)
        self.assertEqual(map_recipe_name("light soy sauce"), 174277)
        self.assertEqual(map_recipe_name("vanilla extract"), 173471)
        self.assertEqual(map_recipe_name("pure vanilla extract"), 173471)
        self.assertEqual(map_recipe_name("water"), 173647)
        self.assertEqual(map_recipe_name("sesame oil"), 171016)
        self.assertEqual(map_recipe_name("baking powder"), 172803)
        self.assertEqual(map_recipe_name("baking soda"), 175040)
        self.assertEqual(map_recipe_name("lemon juice"), 167747)
        self.assertEqual(map_recipe_name("lime juice"), 168156)
        self.assertEqual(map_recipe_name("peanut butter"), 2262072)
        self.assertEqual(map_recipe_name("woda"), 173647)
        self.assertEqual(map_recipe_name("sos sojowy"), 174277)
        self.assertIsNone(map_recipe_name("white wine vinegar"))
        self.assertIsNone(map_recipe_name("rice vinegar"))
        self.assertIsNone(map_recipe_name("mirin"))
        self.assertEqual(map_recipe_name("cornstarch"), 169698)
        self.assertEqual(map_recipe_name("kosher salt"), 173468)
        self.assertEqual(map_recipe_name("chicken stock"), 172884)
        self.assertEqual(map_recipe_name("chicken broth"), 174536)
        self.assertEqual(map_recipe_name("ground cinnamon"), 171320)
        self.assertEqual(map_recipe_name("cinnamon"), 171320)
        self.assertEqual(map_recipe_name("sour cream"), 2346387)
        self.assertIsNone(map_recipe_name("Salt and pepper to taste"))

    def test_does_not_map_stock_as_chicken_meat(self):
        self.assertNotEqual(map_recipe_name("chicken stock"), 171077)
        self.assertNotEqual(map_recipe_name("chicken broth"), 171077)
        self.assertEqual(map_recipe_name("chicken breast"), 171077)
        self.assertNotEqual(map_recipe_name("red wine vinegar"), 173190)
        self.assertEqual(map_recipe_name("red wine vinegar"), 172240)
        self.assertEqual(map_recipe_name("lime"), 168155)
        self.assertNotEqual(map_recipe_name("lime juice"), 167747)
        self.assertEqual(map_recipe_name("vegetable oil"), 171411)
        self.assertEqual(map_recipe_name("canola oil"), 748278)

    def test_prep_notes_and_junk(self):
        self.assertEqual(map_recipe_name("onion, thinly sliced"), 170000)
        self.assertEqual(map_recipe_name("garlic cloves, minced"), 1104647)
        self.assertEqual(map_recipe_name("garlic )"), 1104647)
        self.assertIsNone(map_recipe_name("FENNEL SEEDS, LEMON & HONEY"))
        self.assertIsNone(map_recipe_name("rice vinegar or white vinegar"))
        self.assertEqual(map_recipe_name("oyster sauce or soy sauce"), 174529)
        self.assertEqual(map_recipe_name("packed light or dark brown sugar"), 168833)


if __name__ == "__main__":
    unittest.main()
