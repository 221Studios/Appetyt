import unittest

from scripts.export_mvp_mobile_catalog import (
    _apply_recipe_translations,
    _fill_native_language,
    _overlay_index_translations,
)


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

    def test_native_fill_copies_source_language_only(self):
        foxx = _fill_native_language(
            {
                "id": "foxx-1",
                "title": "Zupa czosnkowa",
                "category": "Zupy",
                "creator_id": "foxx_gotuje",
                "ingredients": ["4 ząbki czosnku"],
                "steps": ["Podgrzej olej."],
            }
        )
        sam = _fill_native_language(
            {
                "id": "sam-1",
                "title": "Garlic soup",
                "category": "Soups",
                "creator_id": "sam_the_cooking_guy",
                "ingredients": ["4 garlic cloves"],
                "steps": ["Heat the oil."],
            }
        )

        self.assertEqual(foxx["title_pl"], "Zupa czosnkowa")
        self.assertEqual(foxx["steps_pl"], ["Podgrzej olej."])
        self.assertNotIn("title_en", foxx)
        self.assertEqual(sam["title_en"], "Garlic soup")
        self.assertEqual(sam["steps_en"], ["Heat the oil."])
        self.assertNotIn("title_pl", sam)

    def test_index_overlay_keeps_titles_without_empty_index_steps(self):
        recipe = {
            "id": "sam-1",
            "title": "Garlic soup",
            "creator_id": "sam_the_cooking_guy",
            "ingredients": ["4 garlic cloves"],
            "steps": ["Heat the oil.", "Add garlic."],
        }
        indexed = {
            "id": "sam-1",
            "title_pl": "Zupa czosnkowa",
            "title_en": "Garlic soup",
            "ingredients_pl": ["4 ząbki czosnku"],
            "ingredients_en": ["4 garlic cloves"],
            "image_url": "/recipe-images/sam-1.webp",
            "steps_pl": [],
            "steps_en": [],
        }

        result = _overlay_index_translations(recipe, indexed)

        self.assertEqual(result["title_pl"], "Zupa czosnkowa")
        self.assertEqual(result["ingredients_pl"], ["4 ząbki czosnku"])
        self.assertEqual(result["image_url"], "/recipe-images/sam-1.webp")
        self.assertNotIn("steps_pl", result)


if __name__ == "__main__":
    unittest.main()
