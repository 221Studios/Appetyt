from scripts.export_mvp_mobile_catalog import build_mobile_catalog_index


def test_mobile_index_keeps_search_fields_but_drops_steps() -> None:
    recipe = {
        "id": "recipe-1",
        "title": "Pasta",
        "title_pl": "Makaron",
        "ingredients": ["200 g makaronu"],
        "ingredients_pl": ["200 g makaronu"],
        "ingredients_en": ["200 g pasta"],
        "steps": ["Gotuj."],
        "steps_pl": ["Gotuj."],
        "steps_en": ["Cook."],
        "creator_id": "foxx_gotuje",
        "source_url": "https://example.com/recipe-1",
    }

    index = build_mobile_catalog_index(recipe)

    assert index["title_pl"] == "Makaron"
    assert index["ingredients_pl"] == ["200 g makaronu"]
    assert index["steps"] == []
    assert index["steps_pl"] == []
    assert index["steps_en"] == []
