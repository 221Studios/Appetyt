"""Build strict Foxx app data and a machine-readable readiness audit."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.app_recipe import build_app_recipe, load_nutrients
from scripts.complete_foxx_recipe import build_foxx_completeness
from scripts.recipe_completeness import completeness_verdict

RECIPES_DB = ROOT / "data" / "recipes.sqlite"
APP_PATH = ROOT / "data" / "app_recipes.json"
AUDIT_PATH = ROOT / "data" / "foxx_gotuje_readiness.json"
LEGACY_REPORT_PATH = ROOT / "data" / "foxx_gotuje_completeness_report.json"
CREATOR_ID = "foxx_gotuje"


def _rows(db_path: Path) -> list[sqlite3.Row]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        return conn.execute(
            """
            SELECT source_url, creator_id, title, prep_minutes, cook_minutes,
                   total_minutes, recipe_yield, ingredients_json,
                   source_steps_json, fetched_at
            FROM recipes
            WHERE creator_id = ?
            ORDER BY title COLLATE NOCASE
            """,
            (CREATOR_ID,),
        ).fetchall()
    finally:
        conn.close()


def _source_payload(row: sqlite3.Row) -> dict:
    return {
        "source_url": row["source_url"],
        "creator_id": row["creator_id"],
        "title": row["title"],
        "prep_minutes": row["prep_minutes"],
        "cook_minutes": row["cook_minutes"],
        "total_minutes": row["total_minutes"],
        "recipe_yield": row["recipe_yield"],
        "ingredients": row["ingredients_json"],
        "source_steps": row["source_steps_json"],
        "fetched_at": row["fetched_at"],
    }


def export_foxx_app(
    db_path: Path = RECIPES_DB,
    app_path: Path = APP_PATH,
    audit_path: Path = AUDIT_PATH,
    legacy_report_path: Path = LEGACY_REPORT_PATH,
) -> dict[str, int | str]:
    nutrients = load_nutrients()
    app_recipes: list[dict] = []
    audit: list[dict] = []
    for row in _rows(db_path):
        source = _source_payload(row)
        app = build_app_recipe(source, nutrients=nutrients)
        source_recipe = {
            "title": row["title"],
            "source_url": row["source_url"],
            "ingredients": json.loads(row["ingredients_json"] or "[]"),
            "source_steps": json.loads(row["source_steps_json"] or "[]"),
        }
        # The strict gate is the single authority for inclusion in runtime data.
        payload = build_foxx_completeness(
            source_recipe,
            nutrients=nutrients,
            servings=app["servings"],
        )
        verdict = completeness_verdict(payload)
        audit.append(
            {
                "id": app["id"],
                "title": app["title"],
                "source_url": app["source_url"],
                "complete": verdict["complete"],
                "reasons": verdict["reasons"],
                "ingredient_count": app["ingredient_count"],
                "mapped_count": app["mapped_count"],
                "mapped_ratio": round(app["mapped_ratio"], 4),
                "grams_count": sum(line.get("amount_g") is not None for line in payload["lines"]),
                "store_intersection": sorted(
                    set.intersection(
                        *(set(line.get("stores_with_product") or []) for line in payload["lines"])
                    )
                )
                if payload["lines"]
                else [],
                "nutrition": payload["nutrition"],
            }
        )
        if not verdict["complete"]:
            continue
        # ``build_foxx_completeness`` also applies the documented defaults for
        # unquantified seasoning/water lines.  Carry those resolved grams and
        # the strict nutrition totals into the runtime payload so the app does
        # not silently fall back to a different calculation.
        for app_line, quality_line in zip(app["ingredients"], payload["lines"]):
            app_line["amount_g"] = quality_line["amount_g"]
        for key in (
            "calories_per_serving",
            "protein_per_serving",
            "fat_per_serving",
            "carbs_per_serving",
        ):
            app[key] = payload["nutrition"][key]
        app["calories_total"] = payload["nutrition"]["calories_total"]
        app_recipes.append(
            {
                key: value
                for key, value in app.items()
                if key not in {"mapped_count", "mapped_ratio", "ingredient_count"}
            }
        )

    app_path.parent.mkdir(parents=True, exist_ok=True)
    app_path.write_text(json.dumps(app_recipes, ensure_ascii=False) + "\n", encoding="utf-8")
    audit_path.write_text(
        json.dumps(
            {
                "schema_version": "foxx-readiness-v1",
                "creator_id": CREATOR_ID,
                "scanned": len(audit),
                "complete": sum(item["complete"] for item in audit),
                "recipes": audit,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    legacy_report_path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "creator_id": CREATOR_ID,
                "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "catalog_path": str(ROOT / "data" / "foxx_gotuje_catalog.json"),
                "canonical_db": str(db_path),
                "total": len(audit),
                "complete": sum(item["complete"] for item in audit),
                "incomplete": sum(not item["complete"] for item in audit),
                "recipes": [
                    {
                        "source_url": item["source_url"],
                        "title": item["title"],
                        "complete": item["complete"],
                        "reasons": item["reasons"],
                        "calories_total": (item["nutrition"] or {}).get("calories_total"),
                        "calories_per_serving": (item["nutrition"] or {}).get(
                            "calories_per_serving"
                        ),
                    }
                    for item in audit
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return {
        "scanned": len(audit),
        "exported": len(app_recipes),
        "app_path": str(app_path),
        "audit_path": str(audit_path),
        "legacy_report_path": str(legacy_report_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=RECIPES_DB)
    parser.add_argument("--out", type=Path, default=APP_PATH)
    parser.add_argument("--audit", type=Path, default=AUDIT_PATH)
    args = parser.parse_args()
    print(json.dumps(export_foxx_app(args.db, args.out, args.audit), ensure_ascii=False))


if __name__ == "__main__":
    main()
