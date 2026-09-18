"""Export only completeness-passing recipes (Foxx smoke → app_recipes.json)."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.app_recipe import build_app_recipe, load_nutrients

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_REPORT = ROOT / "data" / "foxx_gotuje_completeness_report.json"
DEFAULT_OUT = ROOT / "data" / "app_recipes.json"


def export_complete_from_report(
    *,
    recipes_db: Path | None = None,
    report_path: Path | None = None,
    out_path: Path | None = None,
    creator_id: str | None = "foxx_gotuje",
) -> dict:
    """Eksportuj do JSON tylko URL-e oznaczone complete w raporcie kompletności."""
    db = Path(recipes_db or DEFAULT_DB)
    report = json.loads(Path(report_path or DEFAULT_REPORT).read_text(encoding="utf-8"))
    complete_urls = {
        row["source_url"]
        for row in report.get("recipes") or []
        if row.get("complete")
    }
    if creator_id and report.get("creator_id") and report["creator_id"] != creator_id:
        complete_urls = set()

    conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT source_url, creator_id, title, prep_minutes, cook_minutes, "
        "total_minutes, recipe_yield, ingredients_json, source_steps_json, fetched_at "
        "FROM recipes WHERE source_url IN ({})".format(
            ",".join("?" for _ in complete_urls) or "NULL"
        ),
        tuple(complete_urls),
    ).fetchall() if complete_urls else []
    conn.close()

    nutrients = load_nutrients()
    exported = []
    for row in rows:
        payload = build_app_recipe(
            {
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
            },
            nutrients=nutrients,
        )
        exported.append(
            {
                k: v
                for k, v in payload.items()
                if k not in {"mapped_count", "mapped_ratio", "ingredient_count"}
            }
        )

    out = Path(out_path or DEFAULT_OUT)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(exported, ensure_ascii=False) + "\n", encoding="utf-8")
    return {
        "complete_urls": len(complete_urls),
        "exported": len(exported),
        "path": str(out),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export completeness-passing Foxx recipes for API smoke seed."
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    stats = export_complete_from_report(
        recipes_db=args.db,
        report_path=args.report,
        out_path=args.out,
    )
    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
