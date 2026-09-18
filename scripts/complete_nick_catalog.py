"""Przebieg całego katalogu Nicka DiGiovanni: ingest + raport kompletności."""

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

from scripts.complete_foxx_recipe import build_foxx_completeness, ingest_foxx_recipe

CREATOR_ID = "nick_digiovanni"
DEFAULT_CATALOG = ROOT / "data" / "nick_digiovanni_catalog.json"
DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_REPORT = ROOT / "data" / "nick_digiovanni_completeness_report.json"


def _existing_urls(db_path: Path, creator_id: str) -> set[str]:
    if not db_path.exists():
        return set()
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT source_url FROM recipes WHERE creator_id = ?",
            (creator_id,),
        ).fetchall()
    finally:
        conn.close()
    return {row[0] for row in rows}


def _result_from_db(db_path: Path, source_url: str) -> dict:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            "SELECT title, recipe_yield, ingredients_json, source_steps_json "
            "FROM recipes WHERE source_url = ?",
            (source_url,),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        return {
            "source_url": source_url,
            "verdict": {"complete": False, "reasons": ["missing_row"]},
        }
    recipe = {
        "title": row["title"],
        "source_url": source_url,
        "recipe_yield": row["recipe_yield"],
        "ingredients": json.loads(row["ingredients_json"] or "[]"),
        "source_steps": json.loads(row["source_steps_json"] or "[]"),
    }
    payload = build_foxx_completeness(recipe)
    payload["source_url"] = source_url
    payload["title"] = row["title"]
    return payload


def complete_nick_catalog(
    *,
    catalog_path: Path | None = None,
    recipes_db: Path | None = None,
    report_path: Path | None = None,
    limit: int = 0,
    resume: bool = True,
) -> dict:
    cat_path = Path(catalog_path or DEFAULT_CATALOG)
    db_path = Path(recipes_db or DEFAULT_DB)
    out_path = Path(report_path or DEFAULT_REPORT)
    catalog = json.loads(cat_path.read_text(encoding="utf-8"))
    urls = [item["source_url"] for item in catalog.get("recipes") or []]
    if limit > 0:
        urls = urls[:limit]

    existing = _existing_urls(db_path, CREATOR_ID) if resume else set()
    rows: list[dict] = []
    complete_n = 0
    for index, url in enumerate(urls, start=1):
        if resume and url in existing:
            result = _result_from_db(db_path, url)
        else:
            result = ingest_foxx_recipe(url, recipes_db=db_path, creator_id=CREATOR_ID)
        verdict = result.get("verdict") or {"complete": False, "reasons": ["unknown"]}
        if verdict.get("complete"):
            complete_n += 1
        rows.append(
            {
                "source_url": url,
                "title": result.get("title"),
                "complete": bool(verdict.get("complete")),
                "reasons": list(verdict.get("reasons") or []),
                "skipped_lines": len(result.get("skipped_lines") or []),
                "kept_lines": len(result.get("lines") or []),
                "calories_total": (result.get("nutrition") or {}).get("calories_total"),
                "calories_per_serving": (result.get("nutrition") or {}).get(
                    "calories_per_serving"
                ),
            }
        )
        if index % 25 == 0 or index == len(urls):
            print(
                json.dumps(
                    {
                        "progress": index,
                        "total": len(urls),
                        "complete_so_far": complete_n,
                        "resumed": len(existing),
                    },
                    ensure_ascii=False,
                ),
                flush=True,
            )

    report = {
        "schema_version": 1,
        "creator_id": CREATOR_ID,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "catalog_path": str(cat_path),
        "canonical_db": str(db_path),
        "total": len(rows),
        "complete": complete_n,
        "incomplete": len(rows) - complete_n,
        "recipes": rows,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Complete Nick DiGiovanni catalog.")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--limit", type=int, default=0, help="0 = all")
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="Re-fetch every URL even if already in the canonical DB.",
    )
    args = parser.parse_args()
    report = complete_nick_catalog(
        catalog_path=args.catalog,
        recipes_db=args.db,
        report_path=args.report,
        limit=args.limit,
        resume=not args.no_resume,
    )
    print(
        json.dumps(
            {
                "total": report["total"],
                "complete": report["complete"],
                "incomplete": report["incomplete"],
                "report": str(args.report),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
