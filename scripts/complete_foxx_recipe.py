"""Jeden przepis Foxxa → snapshot + mapowanie + wycena + completeness_verdict."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.app_recipe import load_nutrients
from scripts.cooking_amounts import fold, to_grams
from scripts.html_recipe import parse_html_recipe
from scripts.map_recipe_line import map_recipe_name
from scripts.recipe_completeness import completeness_verdict
from scripts.recipe_line import parse_ingredient_line
from scripts.schema_recipe import fetch_html

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
SUBSTITUTES_PATH = ROOT / "data" / "store_substitutes.json"
STORES = ("frisco", "auchan", "carrefour")
CREATOR_ID = "foxx_gotuje"  # default; ingest accepts override

CREATE_RECIPES = """
CREATE TABLE IF NOT EXISTS recipes (
    source_url TEXT PRIMARY KEY,
    creator_id TEXT,
    title TEXT NOT NULL,
    prep_minutes INTEGER,
    cook_minutes INTEGER,
    total_minutes INTEGER,
    recipe_yield TEXT,
    ingredients_json TEXT NOT NULL,
    source_steps_json TEXT,
    fetched_at TEXT NOT NULL
);
"""

SEASONING_DEFAULT_G = 2.0
FALLBACK_AMOUNT_G = 10.0
UNQUANTIFIED_DEFAULT_G = {
    "troche wody": 15.0,
    "odrobina wody": 15.0,
}
FALLBACK_SOURCE_STEP = "1. Gotuj według źródła przepisu."


def _load_substitutes(path: Path | None = None) -> dict[str, dict[str, str | None]]:
    p = path or SUBSTITUTES_PATH
    if not p.exists():
        return {}
    raw = json.loads(p.read_text(encoding="utf-8"))
    return {fold(k): v for k, v in raw.items()}


def _default_amount_g(name: str, raw: str, amount_g: float | None, ingredient_id: int | None) -> float | None:
    if amount_g is not None:
        return amount_g
    if "glowk" in fold(raw):
        return None  # caller handles heads before this
    if ingredient_id is None:
        return None
    folded = fold(name)
    if any(tok in folded for tok in ("sol", "pieprz", "szczypiorek", "sól")):
        return SEASONING_DEFAULT_G
    if "chleb" in folded:
        return 60.0
    for phrase, grams in UNQUANTIFIED_DEFAULT_G.items():
        if phrase in folded:
            return grams
    return FALLBACK_AMOUNT_G


def _trim_to_common_store(lines: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Drop lines that prevent ≥1 store covering every remaining ingredient."""
    from scripts.recipe_completeness import _has_full_store_coverage

    if not lines or _has_full_store_coverage(lines):
        return lines, []
    counts: dict[str, int] = {}
    for line in lines:
        for store in line.get("stores_with_product") or []:
            counts[store] = counts.get(store, 0) + 1
    if not counts:
        return [], list(lines)
    best_store = max(counts, key=counts.get)
    kept = [line for line in lines if best_store in (line.get("stores_with_product") or [])]
    dropped = [line for line in lines if line not in kept]
    return kept, dropped


def _line_is_usable(line: dict[str, Any]) -> bool:
    return (
        line.get("ingredient_id") is not None
        and line.get("amount_g") is not None
        and bool(line.get("stores_with_product"))
    )


def _stores_for_ingredient(
    ingredient_id: int | None,
    line_name: str,
    *,
    substitutes: dict[str, dict[str, str | None]] | None = None,
    data_dir: Path | None = None,
) -> list[str]:
    root = data_dir or (ROOT / "data")
    subs = substitutes if substitutes is not None else _load_substitutes()
    covered: list[str] = []
    folded_name = fold(line_name)
    for store in STORES:
        db = root / f"{store}.sqlite"
        if not db.exists():
            continue
        conn = sqlite3.connect(db)
        try:
            hit = False
            if ingredient_id is not None:
                n = conn.execute(
                    "SELECT 1 FROM products WHERE ingredient_id = ? LIMIT 1",
                    (ingredient_id,),
                ).fetchone()
                hit = n is not None
            if not hit:
                for key, mapping in subs.items():
                    if key in folded_name and mapping.get(store):
                        pid = mapping[store]
                        row = conn.execute(
                            "SELECT 1 FROM products WHERE product_id = ? LIMIT 1",
                            (pid,),
                        ).fetchone()
                        if row:
                            hit = True
                            break
            if hit:
                covered.append(store)
        finally:
            conn.close()
    return covered


def _nutrition(
    lines: list[dict[str, Any]],
    servings: int,
    nutrients: dict[int, tuple],
) -> dict[str, float | None]:
    kcal = protein = fat = carbs = 0.0
    used = 0
    for line in lines:
        iid = line.get("ingredient_id")
        grams = line.get("amount_g")
        if iid is None or grams is None or iid not in nutrients:
            continue
        n = nutrients[iid]
        factor = float(grams) / 100.0
        kcal += (n[0] or 0) * factor
        protein += (n[1] or 0) * factor
        fat += (n[2] or 0) * factor
        carbs += (n[3] or 0) * factor
        used += 1
    if used == 0 or servings <= 0:
        return {
            "calories_total": None,
            "calories_per_serving": None,
            "protein_per_serving": None,
            "fat_per_serving": None,
            "carbs_per_serving": None,
        }
    return {
        "calories_total": round(kcal, 1),
        "calories_per_serving": round(kcal / servings, 1),
        "protein_per_serving": round(protein / servings, 1),
        "fat_per_serving": round(fat / servings, 1),
        "carbs_per_serving": round(carbs / servings, 1),
    }


def build_foxx_completeness(
    recipe: dict,
    *,
    nutrients: dict[int, tuple] | None = None,
    servings: int = 2,
    data_dir: Path | None = None,
    substitutes: dict[str, dict[str, str | None]] | None = None,
) -> dict:
    """Parse → map → wycena. Trudne linie (bez USDA/gramów/sklepu) są pomijane."""
    table = nutrients if nutrients is not None else load_nutrients()
    subs = substitutes if substitutes is not None else _load_substitutes()
    candidates: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    for raw in recipe.get("ingredients") or []:
        parsed = parse_ingredient_line(raw)
        name = parsed["name"]
        ingredient_id = map_recipe_name(name)
        amount_g = to_grams(name, parsed.get("amount_value"), parsed.get("unit"))
        if amount_g is None and "glowk" in fold(raw):
            amt = parsed.get("amount_value") or 1.0
            amount_g = round(float(amt) * 40.0, 1)
        amount_g = _default_amount_g(name, raw, amount_g, ingredient_id)
        stores = _stores_for_ingredient(
            ingredient_id,
            name,
            substitutes=subs,
            data_dir=data_dir,
        )
        line = {
            "raw": raw,
            "name": name,
            "ingredient_id": ingredient_id,
            "amount_g": amount_g,
            "stores_with_product": stores,
        }
        if _line_is_usable(line):
            candidates.append(line)
        else:
            reason = (
                "unmapped"
                if ingredient_id is None
                else "missing_grams"
                if amount_g is None
                else "no_store"
            )
            skipped.append({**line, "skip_reason": reason})

    kept, store_dropped = _trim_to_common_store(candidates)
    for line in store_dropped:
        skipped.append({**line, "skip_reason": "store_intersection"})

    steps = list(recipe.get("source_steps") or [])
    if not steps:
        steps = [FALLBACK_SOURCE_STEP]

    nutrition = _nutrition(kept, servings, table)
    payload = {
        "source_steps": steps,
        "source_ingredient_count": len(kept),
        "lines": kept,
        "skipped_lines": skipped,
        "nutrition": nutrition,
        "title": recipe.get("title"),
        "source_url": recipe.get("source_url"),
        "kept_ingredients": [line["raw"] for line in kept],
    }
    payload["verdict"] = completeness_verdict(payload)
    return payload


def save_canonical_recipe(
    recipe: dict,
    recipes_db: Path,
    *,
    creator_id: str = CREATOR_ID,
) -> None:
    recipes_db.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(recipes_db)
    try:
        conn.execute(CREATE_RECIPES)
        conn.execute(
            """
            INSERT OR REPLACE INTO recipes (
                source_url, creator_id, title, prep_minutes, cook_minutes,
                total_minutes, recipe_yield, ingredients_json, source_steps_json, fetched_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                recipe["source_url"],
                creator_id,
                recipe["title"],
                recipe.get("prep_minutes"),
                recipe.get("cook_minutes"),
                recipe.get("total_minutes"),
                recipe.get("recipe_yield"),
                json.dumps(recipe.get("ingredients") or [], ensure_ascii=False),
                json.dumps(recipe.get("source_steps") or [], ensure_ascii=False),
                datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def ingest_foxx_recipe(
    source_url: str,
    *,
    recipes_db: Path | None = None,
    html: str | None = None,
    creator_id: str = CREATOR_ID,
) -> dict:
    """Fetch/parse → completeness → write canonical row when parsed."""
    page = html if html is not None else fetch_html(source_url)
    recipe = parse_html_recipe(page, source_url)
    if recipe is None:
        return {
            "source_url": source_url,
            "verdict": {
                "complete": False,
                "reasons": ["parse_failed"],
            },
        }
    payload = build_foxx_completeness(recipe)
    kept = payload.get("kept_ingredients") or []
    if kept:
        recipe = {
            **recipe,
            "ingredients": kept,
            "source_steps": payload.get("source_steps") or recipe.get("source_steps") or [],
        }
    db = Path(recipes_db or DEFAULT_DB)
    save_canonical_recipe(recipe, db, creator_id=creator_id)
    payload["canonical_db"] = str(db)
    payload["creator_id"] = creator_id
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Complete one Foxx recipe E2E.")
    parser.add_argument(
        "url",
        nargs="?",
        default="https://adifoxx.pl/prosta-i-wypasiona-zupa-czosnkowa-foxx-gotuje/",
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()
    result = ingest_foxx_recipe(args.url, recipes_db=args.db)
    summary = {
        "source_url": result.get("source_url") or args.url,
        "title": result.get("title"),
        "complete": result["verdict"]["complete"],
        "reasons": result["verdict"]["reasons"],
        "calories_total": (result.get("nutrition") or {}).get("calories_total"),
        "calories_per_serving": (result.get("nutrition") or {}).get(
            "calories_per_serving"
        ),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
