"""Export completeness-passing recipes from one or more reports → app_recipes.json."""

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
DEFAULT_OUT = ROOT / "data" / "app_recipes.json"
DEFAULT_REPORTS = (
    ROOT / "data" / "foxx_gotuje_completeness_report.json",
    ROOT / "data" / "sam_the_cooking_guy_completeness_report.json",
    ROOT / "data" / "joshua_weissman_completeness_report.json",
    ROOT / "data" / "nick_digiovanni_completeness_report.json",
)


def _complete_urls_from_report(report_path: Path) -> tuple[str | None, set[str]]:
    report = json.loads(report_path.read_text(encoding="utf-8"))
    creator_id = report.get("creator_id")
    urls = {
        row["source_url"]
        for row in report.get("recipes") or []
        if row.get("complete") and row.get("source_url")
    }
    return creator_id, urls


def export_complete_from_reports(
    *,
    recipes_db: Path | None = None,
    report_paths: list[Path] | None = None,
    out_path: Path | None = None,
) -> dict:
    """Eksportuj URL-e oznaczone complete we wskazanych raportach."""
    db = Path(recipes_db or DEFAULT_DB)
    paths = list(report_paths or DEFAULT_REPORTS)
    complete_urls: set[str] = set()
    per_creator: dict[str, int] = {}
    for path in paths:
        if not path.exists():
            continue
        creator_id, urls = _complete_urls_from_report(path)
        complete_urls |= urls
        key = creator_id or path.name
        per_creator[key] = per_creator.get(key, 0) + len(urls)

    conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    rows = (
        conn.execute(
            "SELECT source_url, creator_id, title, prep_minutes, cook_minutes, "
            "total_minutes, recipe_yield, ingredients_json, source_steps_json, fetched_at "
            "FROM recipes WHERE source_url IN ({})".format(
                ",".join("?" for _ in complete_urls) or "NULL"
            ),
            tuple(sorted(complete_urls)),
        ).fetchall()
        if complete_urls
        else []
    )
    conn.close()

    nutrients = load_nutrients()
    exported = []
    by_creator: dict[str, int] = {}
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
        cid = row["creator_id"] or "?"
        by_creator[cid] = by_creator.get(cid, 0) + 1

    exported.sort(key=lambda item: (item.get("creator_id") or "", item.get("title") or ""))
    out = Path(out_path or DEFAULT_OUT)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(exported, ensure_ascii=False) + "\n", encoding="utf-8")
    return {
        "complete_urls": len(complete_urls),
        "exported": len(exported),
        "by_creator": by_creator,
        "report_complete": per_creator,
        "path": str(out),
    }


def export_complete_from_report(
    *,
    recipes_db: Path | None = None,
    report_path: Path | None = None,
    out_path: Path | None = None,
    creator_id: str | None = "foxx_gotuje",
) -> dict:
    """Backward-compatible single-report export (Foxx smoke tests)."""
    path = Path(report_path or DEFAULT_REPORTS[0])
    report = json.loads(path.read_text(encoding="utf-8"))
    if creator_id and report.get("creator_id") and report["creator_id"] != creator_id:
        out = Path(out_path or DEFAULT_OUT)
        out.write_text("[]\n", encoding="utf-8")
        return {"complete_urls": 0, "exported": 0, "path": str(out)}
    return export_complete_from_reports(
        recipes_db=recipes_db,
        report_paths=[path],
        out_path=out_path,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export completeness-passing recipes for API seed."
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument(
        "--report",
        type=Path,
        action="append",
        dest="reports",
        help="Completeness report JSON (repeatable). Default: Foxx+Sam+Weissman+Nick.",
    )
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    stats = export_complete_from_reports(
        recipes_db=args.db,
        report_paths=args.reports,
        out_path=args.out,
    )
    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
