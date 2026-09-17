#!/usr/bin/env python3
"""Import USDA Foundation Foods + SR Legacy into SQLite."""

from __future__ import annotations

import json
import sqlite3
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
DB_PATH = ROOT / "data" / "ingredients.sqlite"
SCHEMA = ROOT / "docs" / "database" / "0001_ingredients.sql"
CACHE_PATH = ROOT / "data" / "name_pl.json"


def apply_name_pl_cache(conn: sqlite3.Connection) -> int:
    if not CACHE_PATH.exists():
        return 0
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    rows = conn.execute("SELECT ingredient_id, name_en FROM ingredients").fetchall()
    updates = [(cache[name], fdc_id) for fdc_id, name in rows if name in cache]
    conn.executemany(
        "UPDATE ingredients SET name_pl = ? WHERE ingredient_id = ?",
        updates,
    )
    return len(updates)

FOUNDATION_ZIP = RAW / "FoodData_Central_foundation_food_json_2026-04-30.zip"
SR_LEGACY_ZIP = RAW / "FoodData_Central_sr_legacy_food_json_2018-04.zip"

NUTRIENT_KCAL = 1008
NUTRIENT_KJ = 1062
NUTRIENT_ENERGY_ATWATER_SPECIFIC = 2048
NUTRIENT_ENERGY_ATWATER_GENERAL = 2047
NUTRIENT_PROTEIN = 1003
NUTRIENT_FAT = 1004
NUTRIENT_CARBS = 1005
KJ_TO_KCAL = 4.184

SOURCES = (
    (FOUNDATION_ZIP, "FoundationFoods", "Foundation", "2026-04"),
    (SR_LEGACY_ZIP, "SRLegacyFoods", "SR Legacy", "2018-04"),
)


def nutrient_amount(food: dict, nutrient_id: int) -> float | None:
    for item in food.get("foodNutrients") or []:
        if not isinstance(item, dict):
            continue
        nutrient = item.get("nutrient") or {}
        if nutrient.get("id") == nutrient_id:
            amount = item.get("amount")
            if amount is None:
                return None
            return float(amount)
    return None


def kcal_per_100g(food: dict) -> float | None:
    for nutrient_id in (
        NUTRIENT_KCAL,
        NUTRIENT_ENERGY_ATWATER_SPECIFIC,
        NUTRIENT_ENERGY_ATWATER_GENERAL,
    ):
        kcal = nutrient_amount(food, nutrient_id)
        if kcal is not None:
            return kcal
    kj = nutrient_amount(food, NUTRIENT_KJ)
    if kj is None:
        return None
    return kj / KJ_TO_KCAL


def row_from_food(food: dict, data_type: str, source_release: str) -> tuple | None:
    fdc_id = food.get("fdcId")
    name = (food.get("description") or "").strip()
    if fdc_id is None or not name:
        return None
    return (
        int(fdc_id),
        name,
        None,
        kcal_per_100g(food),
        nutrient_amount(food, NUTRIENT_PROTEIN),
        nutrient_amount(food, NUTRIENT_FAT),
        nutrient_amount(food, NUTRIENT_CARBS),
        data_type,
        source_release,
    )


def load_foods(zip_path: Path, array_key: str) -> list[dict]:
    with zipfile.ZipFile(zip_path) as archive:
        names = [n for n in archive.namelist() if n.endswith(".json")]
        if len(names) != 1:
            raise RuntimeError(f"expected one JSON in {zip_path.name}, got {names}")
        with archive.open(names[0]) as handle:
            payload = json.load(handle)
    foods = payload.get(array_key)
    if not isinstance(foods, list):
        raise RuntimeError(f"missing array {array_key} in {zip_path.name}")
    return foods


def import_all(db_path: Path = DB_PATH) -> dict[str, int]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA.read_text(encoding="utf-8"))
        counts: dict[str, int] = {}
        for zip_path, array_key, data_type, source_release in SOURCES:
            if not zip_path.exists():
                raise FileNotFoundError(zip_path)
            rows = []
            for food in load_foods(zip_path, array_key):
                if not isinstance(food, dict):
                    continue
                row = row_from_food(food, data_type, source_release)
                if row:
                    rows.append(row)
            conn.executemany(
                """
                INSERT OR REPLACE INTO ingredients (
                    ingredient_id, name_en, name_pl, kcal_per_100g,
                    protein, fat, carbs, data_type, source_release
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
            )
            counts[data_type] = len(rows)
        counts["name_pl_restored"] = apply_name_pl_cache(conn)
        conn.commit()
        counts["total"] = conn.execute("SELECT COUNT(*) FROM ingredients").fetchone()[0]
        counts["with_kcal"] = conn.execute(
            "SELECT COUNT(*) FROM ingredients WHERE kcal_per_100g IS NOT NULL"
        ).fetchone()[0]
        return counts
    finally:
        conn.close()


def main() -> None:
    counts = import_all()
    print(f"wrote {DB_PATH}")
    for key, value in counts.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
