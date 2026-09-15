"""Deterministic PostgreSQL seed from the checked-in SQLite snapshots.

The source snapshots remain the import boundary. Five small, clearly marked MVP
fixtures provide complete recipes even when the crawler has no usable recipes.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .models import (
    Creator,
    Ingredient,
    PRODUCT_MODELS,
    Recipe,
    RecipeIngredient,
    RecipeStep,
    STORE_NAMES,
    StoreCatalog,
)

FIXTURE_INGREDIENTS = {
    900000001: ("durum wheat pasta", "makaron pszenny durum", 351, 12.5, 1.4, 72.0),
    900000002: ("pork bacon", "boczek wędzony", 541, 37.0, 42.0, 1.4),
    900000003: ("egg yolk", "żółtko jajka", 322, 15.9, 26.5, 3.6),
    900000004: ("pecorino cheese", "ser pecorino", 387, 28.0, 31.0, 3.6),
    900000005: ("black pepper", "pieprz czarny", 251, 10.4, 3.3, 63.9),
    900000006: ("canned tomatoes", "pomidory krojone", 21, 1.1, 0.2, 3.2),
    900000007: ("feta cheese", "ser feta", 264, 14.2, 21.3, 4.1),
    900000008: ("baby spinach", "szpinak baby", 23, 2.9, 0.4, 1.4),
    900000009: ("chickpeas cooked", "ciecierzyca gotowana", 164, 8.9, 2.6, 27.4),
    900000010: ("coconut milk", "mleczko kokosowe", 197, 2.0, 21.3, 2.8),
    900000011: ("white rice", "ryż biały", 130, 2.7, 0.3, 28.2),
    900000012: ("rolled oats", "płatki owsiane", 389, 16.9, 6.9, 66.3),
    900000013: ("apple", "jabłko", 52, 0.3, 0.2, 13.8),
    900000014: ("natural yogurt", "jogurt naturalny", 61, 3.5, 3.3, 4.7),
    900000015: ("peanut butter", "masło orzechowe", 588, 25.1, 50.4, 20.0),
    900000016: ("penne pasta", "makaron penne", 351, 12.5, 1.4, 72.0),
    900000017: ("fresh basil", "świeża bazylia", 23, 3.2, 0.6, 2.7),
    900000018: ("parmesan cheese", "parmezan", 392, 35.8, 25.8, 3.2),
    900000019: ("olive oil", "oliwa z oliwek", 884, 0, 100, 0),
    900000020: ("garlic", "czosnek", 149, 6.4, 0.5, 33.1),
    900000021: ("smoked paprika", "papryka wędzona", 282, 14.1, 12.9, 54.0),
    900000022: ("onion", "cebula", 40, 1.1, 0.1, 9.3),
    900000023: ("curry powder", "curry", 325, 14.3, 14.0, 58.2),
    900000024: ("whole milk", "mleko", 61, 3.2, 3.3, 4.8),
    900000025: ("ground cinnamon", "cynamon", 247, 4.0, 1.2, 80.6),
}

FIXTURE_CREATORS = {
    "mvp-appetyt": ("Kuchnia Appetyt", "chef_pl", "website", "https://appetyt.example/", "pl"),
    "mvp-domowa": ("Domowa Spiżarnia", "influencer_pl", "website", "https://appetyt.example/domowa", "pl"),
}

# These are original MVP adaptations. They intentionally contain no copied prose or images.
FIXTURE_RECIPES = [
    {
        "id": "carbonara-test",
        "title": "Carbonara — przepis testowy",
        "subtitle": "Kremowy makaron bez śmietanki",
        "category": "Makarony",
        "cuisine": "Włoska",
        "creator_id": "mvp-appetyt",
        "source_url": "https://www.budgetbytes.com/spaghetti-carbonara/",
        "duration": 25,
        "servings": 2,
        "nutrition": (620, 29, 25, 68),
        "ingredients": [
            (900000001, "makaron spaghetti", 200, "g", "200 g"),
            (900000002, "boczek wędzony", 120, "g", "120 g"),
            (900000003, "żółtka jaj", 3, "szt", "3 szt."),
            (900000004, "ser pecorino", 40, "g", "40 g"),
            (900000005, "pieprz czarny", 1, "szt", "1 łyżeczka"),
        ],
        "steps": [
            ("Wytop boczek", "Pokrój boczek i smaż na średnim ogniu do chrupkości.", 6),
            ("Przygotuj krem", "Wymieszaj żółtka, ser i pieprz w misce.", 4),
            (
                "Połącz składniki",
                "Ugotuj makaron al dente, zdejmij patelnię z ognia i wymieszaj z kremem "
                "oraz wodą z gotowania.",
                15,
            ),
        ],
    },
    {
        "id": "szakszuka-test",
        "title": "Szakszuka ze szpinakiem — przepis testowy",
        "subtitle": "Szybkie śniadanie z jednej patelni",
        "category": "Szybkie dania",
        "cuisine": "Śródziemnomorska",
        "creator_id": "mvp-appetyt",
        "source_url": "https://www.budgetbytes.com/shakshuka/",
        "duration": 22,
        "servings": 2,
        "nutrition": (380, 20, 22, 28),
        "ingredients": [
            (900000006, "pomidory krojone", 400, "g", "400 g"),
            (900000020, "czosnek", 2, "szt", "2 ząbki"),
            (900000021, "papryka wędzona", 2, "g", "2 g"),
            (900000003, "jajka", 3, "szt", "3 szt."),
            (900000007, "ser feta", 80, "g", "80 g"),
            (900000008, "szpinak baby", 70, "g", "70 g"),
        ],
        "steps": [
            (
                "Zredukuj pomidory",
                "Podgrzej pomidory z czosnkiem i papryką wędzoną, aż sos lekko zgęstnieje.",
                10,
            ),
            ("Dodaj szpinak", "Wmieszaj szpinak i przygotuj trzy zagłębienia w sosie.", 3),
            ("Ugotuj jajka", "Wbij jajka, posyp fetą, przykryj i gotuj do ścięcia białek.", 9),
        ],
    },
    {
        "id": "curry-ciecierzyca-test",
        "title": "Curry z ciecierzycą — przepis testowy",
        "subtitle": "Roślinne danie na dwa dni",
        "category": "Roślinne",
        "cuisine": "Azjatycka",
        "creator_id": "mvp-domowa",
        "source_url": "https://www.budgetbytes.com/chana-aloo-curry/",
        "duration": 30,
        "servings": 4,
        "nutrition": (455, 15, 18, 54),
        "ingredients": [
            (900000009, "ciecierzyca gotowana", 400, "g", "400 g"),
            (900000006, "pomidory krojone", 400, "g", "400 g"),
            (900000010, "mleczko kokosowe", 400, "ml", "400 ml"),
            (900000011, "ryż biały", 280, "g", "280 g"),
            (900000008, "szpinak baby", 100, "g", "100 g"),
            (900000022, "cebula", 1, "szt", "1 szt."),
            (900000023, "curry", 5, "g", "5 g"),
        ],
        "steps": [
            ("Zbuduj bazę", "Podsmaż cebulę z curry, dodaj pomidory.", 8),
            ("Gotuj curry", "Dodaj ciecierzycę i mleczko kokosowe, gotuj do połączenia smaków.", 17),
            ("Podaj z ryżem", "Ugotuj ryż i pod koniec dodaj szpinak do curry.", 5),
        ],
    },
    {
        "id": "owsianka-jablko-test",
        "title": "Owsianka z jabłkiem — przepis testowy",
        "subtitle": "Ciepłe śniadanie w 10 minut",
        "category": "Śniadania",
        "cuisine": "Domowa",
        "creator_id": "mvp-domowa",
        "source_url": "https://www.budgetbytes.com/apple-cinnamon-oatmeal/",
        "duration": 10,
        "servings": 2,
        "nutrition": (390, 14, 14, 53),
        "ingredients": [
            (900000012, "płatki owsiane", 100, "g", "100 g"),
            (900000024, "mleko", 250, "ml", "250 ml"),
            (900000013, "jabłko", 180, "g", "1 duże"),
            (900000025, "cynamon", 2, "g", "2 g"),
            (900000014, "jogurt naturalny", 150, "g", "150 g"),
            (900000015, "masło orzechowe", 30, "g", "2 łyżki"),
        ],
        "steps": [
            ("Podgrzej płatki", "Gotuj płatki w mleku do miękkości.", 7),
            ("Dodaj jabłko", "Dodaj starte jabłko i cynamon, podgrzewaj jeszcze chwilę.", 2),
            ("Wykończ", "Podaj z jogurtem i masłem orzechowym.", 1),
        ],
    },
    {
        "id": "penne-pesto-test",
        "title": "Penne z bazylią i parmezanem — przepis testowy",
        "subtitle": "Prosty makaron na szybki obiad",
        "category": "Makarony",
        "cuisine": "Włoska",
        "creator_id": "mvp-appetyt",
        "source_url": "https://www.budgetbytes.com/pesto-pasta/",
        "duration": 18,
        "servings": 2,
        "nutrition": (510, 19, 20, 64),
        "ingredients": [
            (900000016, "makaron penne", 200, "g", "200 g"),
            (900000017, "świeża bazylia", 30, "g", "30 g"),
            (900000018, "parmezan", 40, "g", "40 g"),
            (900000019, "oliwa z oliwek", 30, "ml", "30 ml"),
            (900000005, "pieprz czarny", 1, "szt", "do smaku"),
        ],
        "steps": [
            ("Ugotuj makaron", "Ugotuj penne al dente i zachowaj trochę wody z garnka.", 12),
            ("Zblenduj pesto", "Połącz bazylię, oliwę, parmezan i pieprz.", 3),
            ("Wymieszaj", "Wymieszaj makaron z pesto, rozrzedzając je wodą z gotowania.", 3),
        ],
    },
]

STORE_SOURCES = {
    "frisco": "https://www.frisco.pl/",
    "auchan": "https://zakupy.auchan.pl/",
    "carrefour": "https://www.carrefour.pl/",
}


def parse_datetime(value: object) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _seed_ingredients(session: Session, data_dir: Path) -> None:
    if (session.scalar(select(func.count()).select_from(Ingredient)) or 0) == 0:
        path = data_dir / "ingredients.sqlite"
        if path.exists():
            conn = sqlite3.connect(path)
            rows = conn.execute(
                "SELECT ingredient_id, name_en, name_pl, kcal_per_100g, protein, fat, carbs, "
                "data_type, source_release FROM ingredients"
            ).fetchall()
            conn.close()
            session.bulk_insert_mappings(
                Ingredient,
                [
                    {
                        "id": row[0],
                        "name_en": row[1],
                        "name_pl": row[2],
                        "kcal_per_100g": row[3],
                        "protein_per_100g": row[4],
                        "fat_per_100g": row[5],
                        "carbs_per_100g": row[6],
                        "source_release": row[7] or row[8],
                    }
                    for row in rows
                ],
            )
    existing = set(session.scalars(select(Ingredient.id)).all())
    session.add_all(
        [
            Ingredient(
                id=ingredient_id,
                name_en=values[0],
                name_pl=values[1],
                kcal_per_100g=values[2],
                protein_per_100g=values[3],
                fat_per_100g=values[4],
                carbs_per_100g=values[5],
                source_release="USDA FoodData Central — MVP fixture",
            )
            for ingredient_id, values in FIXTURE_INGREDIENTS.items()
            if ingredient_id not in existing
        ]
    )


def _seed_creators(session: Session, data_dir: Path) -> None:
    if (session.scalar(select(func.count()).select_from(Creator)) or 0) == 0:
        path = data_dir / "recipes.sqlite"
        if path.exists():
            conn = sqlite3.connect(path)
            columns = {row[1] for row in conn.execute("PRAGMA table_info(creators)")}
            youtube_column = "youtube_url" if "youtube_url" in columns else "NULL"
            rows = conn.execute(
                f"SELECT creator_id, name, category, primary_source, website_url, {youtube_column}, "
                "language FROM creators"
            ).fetchall()
            conn.close()
            session.bulk_insert_mappings(
                Creator,
                [
                    {
                        "id": row[0],
                        "name": row[1],
                        "category": row[2],
                        "primary_source": row[3],
                        "website_url": row[4],
                        "youtube_url": row[5],
                        "language": row[6],
                    }
                    for row in rows
                ],
            )
    existing = set(session.scalars(select(Creator.id)).all())
    session.add_all(
        [
            Creator(
                id=creator_id,
                name=values[0],
                category=values[1],
                primary_source=values[2],
                website_url=values[3],
                language=values[4],
            )
            for creator_id, values in FIXTURE_CREATORS.items()
            if creator_id not in existing
        ]
    )


def _seed_catalogs(session: Session) -> None:
    for slug in PRODUCT_MODELS:
        source_url = STORE_SOURCES[slug]
        if session.get(StoreCatalog, slug) is None:
            session.add(StoreCatalog(slug=slug, name=STORE_NAMES[slug], source_url=source_url))


def _seed_products(session: Session, data_dir: Path) -> None:
    for slug, model in PRODUCT_MODELS.items():
        if (session.scalar(select(func.count()).select_from(model)) or 0) == 0:
            path = data_dir / f"{slug}.sqlite"
            if path.exists():
                conn = sqlite3.connect(path)
                rows = conn.execute(
                    "SELECT product_id, ean, name, brand, category, package_qty, package_unit, "
                    "package_size_g, price_pln, price_per_100g, url, fetched_at, ingredient_id "
                    "FROM products"
                ).fetchall()
                conn.close()
                session.bulk_insert_mappings(
                    model,
                    [
                        {
                            "id": row[0],
                            "ean": row[1],
                            "name": row[2],
                            "brand": row[3],
                            "category": row[4],
                            "package_qty": row[5],
                            "package_unit": row[6],
                            "package_size_g": row[7],
                            "price_pln": row[8],
                            "price_per_100g": row[9],
                            "source_url": row[10],
                            "source_updated_at": parse_datetime(row[11]),
                            "ingredient_id": row[12],
                        }
                        for row in rows
                    ],
                )
        existing = set(session.scalars(select(model.id)).all())
        source_updated = datetime(2025, 1, 1, tzinfo=timezone.utc)
        piece_ingredients = {900000003, 900000005, 900000020, 900000022}
        volume_ingredients = {900000010, 900000019}
        for ingredient_id, values in FIXTURE_INGREDIENTS.items():
            product_id = f"mvp-{slug}-{ingredient_id}"
            if product_id not in existing:
                session.add(
                    model(
                        id=product_id,
                        name=f"{values[1].capitalize()} — opakowanie testowe",
                        brand="Appetyt MVP",
                        category="MVP fixture",
                        package_qty=10 if ingredient_id in piece_ingredients else 1000,
                        package_unit=(
                            "szt"
                            if ingredient_id in piece_ingredients
                            else ("ml" if ingredient_id in volume_ingredients else "g")
                        ),
                        package_size_g=None
                        if ingredient_id in piece_ingredients or ingredient_id in volume_ingredients
                        else 1000,
                        price_pln=round(3.5 + (ingredient_id % 17) * 0.43, 2),
                        price_per_100g=None,
                        source_url=STORE_SOURCES[slug],
                        source_updated_at=source_updated,
                        ingredient_id=ingredient_id,
                    )
                )


def _seed_recipes(session: Session) -> None:
    for fixture in FIXTURE_RECIPES:
        calories, protein, fat, carbs = fixture["nutrition"]
        recipe = session.get(Recipe, fixture["id"])
        if recipe is None:
            recipe = Recipe(id=fixture["id"])
            session.add(recipe)
        recipe.title = fixture["title"]
        recipe.subtitle = fixture["subtitle"]
        recipe.category = fixture["category"]
        recipe.cuisine = fixture["cuisine"]
        recipe.creator_id = fixture["creator_id"]
        recipe.source_url = fixture["source_url"]
        recipe.source_updated_at = datetime(2025, 1, 1, tzinfo=timezone.utc)
        recipe.duration_minutes = fixture["duration"]
        recipe.servings = fixture["servings"]
        recipe.calories_per_serving = calories
        recipe.protein_per_serving = protein
        recipe.fat_per_serving = fat
        recipe.carbs_per_serving = carbs
        recipe.ingredients = [
            RecipeIngredient(
                ingredient_id=ingredient_id,
                name=name,
                amount_value=amount,
                amount_text=amount_text,
                unit=unit,
                scalable=True,
                sort_order=index,
            )
            for index, (ingredient_id, name, amount, unit, amount_text) in enumerate(fixture["ingredients"])
        ]
        recipe.steps = [
            RecipeStep(
                step_number=index + 1,
                title=title,
                instructions=instructions,
                duration_minutes=duration,
            )
            for index, (title, instructions, duration) in enumerate(fixture["steps"])
        ]


def seed_database(session: Session, data_dir: Path | None = None) -> None:
    source_dir = data_dir or get_settings().data_dir
    _seed_catalogs(session)
    _seed_ingredients(session, source_dir)
    _seed_creators(session, source_dir)
    session.flush()
    _seed_products(session, source_dir)
    _seed_recipes(session)
    session.commit()


if __name__ == "__main__":
    from .db import SessionLocal

    with SessionLocal() as db:
        seed_database(db)
    print("Appetyt seed complete")
