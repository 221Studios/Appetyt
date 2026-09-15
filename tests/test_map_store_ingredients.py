import sqlite3
import unittest

from scripts.map_store_ingredients import best_ingredient, map_products, rule_match


class RuleTests(unittest.TestCase):
    def test_wheat_flour_not_graham(self):
        self.assertEqual(rule_match("Mąka pszenna wrocławska (typ 500)"), 168894)
        self.assertEqual(rule_match("Mąka pszenna grahamka (typ 1850)"), 168893)

    def test_eggs_skip_cat_toy(self):
        self.assertEqual(rule_match("Jaja od kury 10 szt"), 171287)
        self.assertIsNone(rule_match("Jajko z niespodzianką dla KOTA"))

    def test_milk_skips_formula_and_cookie_flavor(self):
        self.assertEqual(rule_match("Mleko UHT 3,2% 1 l"), 746782)
        self.assertIsNone(rule_match("Mleko UHT o smaku ciasteczkowym"))
        self.assertIsNone(rule_match("Mydło w płynie Mleko i Miód"))

    def test_more_staples(self):
        self.assertEqual(rule_match("Twaróg półtłusty 1 kg"), 172179)
        self.assertEqual(rule_match("Schab wieprzowy z kością"), 168263)
        self.assertEqual(rule_match("Ogórek gruntowy"), 2346406)
        self.assertIsNone(rule_match("Ogórki kiszone"))
        self.assertEqual(rule_match("Mięso mielone wołowe"), 2514744)
        self.assertEqual(rule_match("Ser Mozzarella 125 g"), 329370)
        self.assertIsNone(rule_match("Kurczak w sosie z mozzarellą"))
        self.assertEqual(rule_match("Koncentrat pomidorowy 30%"), 170459)
        self.assertEqual(rule_match("Kapusta kiszona"), 169279)
        self.assertEqual(rule_match("Papryka słodka mielona"), 171329)
        self.assertEqual(rule_match("Naturalna woda mineralna niegazowana"), 173647)
        self.assertEqual(rule_match("Orzeszki ziemne prażone"), 172430)
        self.assertEqual(rule_match("Sos sojowy 150 ml"), 174277)
        self.assertEqual(rule_match("Serek wiejski naturalny"), 2346384)
        self.assertEqual(rule_match("Cukier trzcinowy BIO"), 168833)


class IndexPickTests(unittest.TestCase):
    def test_spinach_uses_rule(self):
        self.assertEqual(rule_match("Szpinak 300 g"), 168462)


class MapDbTests(unittest.TestCase):
    def test_writes_ingredient_id(self):
        ing = sqlite3.connect(":memory:")
        store = sqlite3.connect(":memory:")
        ing.execute(
            "CREATE TABLE ingredients (ingredient_id INTEGER, name_en TEXT, data_type TEXT)"
        )
        ing.execute(
            "INSERT INTO ingredients VALUES (171287, 'Egg, whole, raw, fresh', 'SR Legacy')"
        )
        store.execute("CREATE TABLE products (product_id TEXT, name TEXT, ingredient_id INTEGER)")
        store.execute("INSERT INTO products VALUES ('a', 'Jaja 10 szt', NULL)")
        store.execute("INSERT INTO products VALUES ('b', 'Żel do udrażniania rur', NULL)")
        stats = map_products(ing, store)
        self.assertEqual(stats["mapped"], 1)
        self.assertEqual(
            store.execute("SELECT ingredient_id FROM products WHERE product_id='a'").fetchone()[0],
            171287,
        )
        self.assertIsNone(
            store.execute("SELECT ingredient_id FROM products WHERE product_id='b'").fetchone()[0]
        )


if __name__ == "__main__":
    unittest.main()
