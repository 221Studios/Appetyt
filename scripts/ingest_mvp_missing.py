"""Ingest missing MVP catalog URLs into recipes.sqlite (raw ingredients, no store mapping)."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.audit_mvp_source import CREATORS, load_catalog_urls, parse_live_recipe
from scripts.schema_recipe import fetch_html, save_recipe

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"


def ingest_url(source_url: str, creator_id: str, db_path: Path) -> dict:
    try:
        html = fetch_html(source_url)
        recipe = parse_live_recipe(html, source_url)
    except Exception as exc:
        return {"source_url": source_url, "ok": False, "error": str(exc)[:300]}
    if recipe is None:
        return {"source_url": source_url, "ok": False, "error": "parse_failed"}
    save_recipe(recipe, creator_id=creator_id, db_path=db_path)
    return {
        "source_url": source_url,
        "ok": True,
        "title": recipe.get("title"),
        "ingredients": len(recipe.get("ingredients") or []),
    }


def missing_urls(creator_id: str, db_path: Path) -> list[str]:
    catalog = load_catalog_urls(CREATORS[creator_id]["catalog"])
    conn = sqlite3.connect(db_path)
    existing = {
        row[0]
        for row in conn.execute(
            "SELECT source_url FROM recipes WHERE creator_id = ?",
            (creator_id,),
        )
    }
    conn.close()
    return [u for u in catalog if u not in existing]


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest missing MVP catalog recipes.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--creator", action="append", dest="creators")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    creators = args.creators or list(CREATORS.keys())
    summary = {}
    for creator_id in creators:
        urls = missing_urls(creator_id, args.db)
        if args.limit is not None:
            urls = urls[: args.limit]
        results = []
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
            futs = {
                pool.submit(ingest_url, url, creator_id, args.db): url for url in urls
            }
            for fut in as_completed(futs):
                results.append(fut.result())
        ok = sum(1 for r in results if r.get("ok"))
        summary[creator_id] = {
            "attempted": len(results),
            "ok": ok,
            "failed": len(results) - ok,
            "failures": [r for r in results if not r.get("ok")][:20],
        }
        print(json.dumps({creator_id: summary[creator_id]}, ensure_ascii=False, indent=2))
    args.db.with_name("mvp_ingest_missing.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
