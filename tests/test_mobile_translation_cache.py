import unittest

from scripts.export_mvp_mobile_catalog import _apply_recipe_translations


class MobileTranslationCacheTests(unittest.TestCase):
    def test_export_merges_both_recipe_languages(self):
        recipe = {
            "id": "recipe-1",
            "title": "English title",
            "category": "Dessert",
            "ingredients": ["1 cup flour"],
            "steps": ["Mix the flour."],
        }
        translations = {
            "recipe-1": {
                "pl": {
                    "title": "Polski tytuł",
                    "category": "Deser",
                    "ingredients": ["1 szklanka mąki"],
                    "steps": ["Wymieszaj mąkę."],
                },
                "en": {
                    "title": "English title",
                    "category": "Dessert",
                    "ingredients": ["1 cup flour"],
                    "steps": ["Mix the flour."],
                },
            }
        }

        result = _apply_recipe_translations(recipe, translations)

        self.assertEqual(result["title_pl"], "Polski tytuł")
        self.assertEqual(result["steps_pl"], ["Wymieszaj mąkę."])
        self.assertEqual(result["category_pl"], "Deser")
        self.assertEqual(result["translations"]["en"]["ingredients"], ["1 cup flour"])


if __name__ == "__main__":
    unittest.main()
