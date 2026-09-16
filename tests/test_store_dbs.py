import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from backend.app.units import normalize_amount
from scripts.store_dbs import (
    basket_cost,
    import_catalog,
    init_all_store_dbs,
    package_size_g,
    usage_cost,
)


class CostTests(unittest.TestCase):
    def test_flour_usage_and_full_pack(self):
        price = 3.50
        pack_g = 1000.0
        used_g = 200.0
        self.assertAlmostEqual(usage_cost(price, pack_g, used_g), 0.70)
        self.assertAlmostEqual(basket_cost(price, pack_g, used_g), 3.50)

    def test_eggs_need_one_carton(self):
        self.assertAlmostEqual(usage_cost(12.0, 10, 3), 3.60)
        self.assertAlmostEqual(basket_cost(12.0, 10, 3), 12.0)

    def test_two_packs_when_recipe_exceeds_one(self):
        self.assertAlmostEqual(basket_cost(4.0, 500, 600), 8.0)


class SchemaTests(unittest.TestCase):
    def test_three_separate_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            data_dir = Path(tmp)
            paths = init_all_store_dbs(data_dir)
            slugs = []
            for path in paths:
                self.assertTrue(path.exists())
                conn = sqlite3.connect(path)
                slug, name = conn.execute(
                    "SELECT store_slug, store_name FROM store_meta"
                ).fetchone()
                conn.close()
                slugs.append(slug)
                self.assertIn(slug, path.name)
                self.assertTrue(name)
            self.assertEqual(sorted(slugs), ["auchan", "carrefour", "frisco"])

    def test_import_goes_only_to_matching_store(self):
        with tempfile.TemporaryDirectory() as tmp:
            data_dir = Path(tmp)
            init_all_store_dbs(data_dir)
            catalog = data_dir / "frisco.json"
            catalog.write_text(
                json.dumps(
                    {
                        "store": "frisco",
                        "fetched_at": "2026-09-15T12:00:00Z",
                        "products": [
                            {
                                "product_id": "maka-1",
                                "name": "Mąka pszenna 1 kg",
                                "package_qty": 1,
                                "package_unit": "kg",
                                "price_pln": 3.5,
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            self.assertEqual(import_catalog(catalog, data_dir=data_dir), 1)
            with self.assertRaises(ValueError):
                import_catalog(catalog, store_slug="auchan", data_dir=data_dir)

            frisco = sqlite3.connect(data_dir / "frisco.sqlite")
            auchan = sqlite3.connect(data_dir / "auchan.sqlite")
            try:
                self.assertEqual(
                    frisco.execute("SELECT COUNT(*) FROM products").fetchone()[0],
                    1,
                )
                self.assertEqual(
                    auchan.execute("SELECT COUNT(*) FROM products").fetchone()[0],
                    0,
                )
                grams = frisco.execute(
                    "SELECT package_size_g, price_per_100g FROM products"
                ).fetchone()
                self.assertEqual(grams[0], 1000.0)
                self.assertAlmostEqual(grams[1], 0.35)
            finally:
                frisco.close()
                auchan.close()

    def test_package_size_g_uses_backend_unit_contract(self):
        for qty, unit in ((10, "szt"), (500, "ml"), (1, "litr"), (2, "kilograms")):
            normalized = normalize_amount(qty, unit)
            expected = None if normalized is None or normalized[1] == "piece" else normalized[0]
            self.assertEqual(package_size_g(qty, unit), expected)


if __name__ == "__main__":
    unittest.main()
