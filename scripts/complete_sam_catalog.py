"""Przebieg całego katalogu Sama: ingest + raport kompletności."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.complete_foxx_recipe import ingest_foxx_recipe

CREATOR_ID = "sam_the_cooking_guy"
DEFAULT_CATALOG = ROOT / "data" / "sam_the_cooking_guy_catalog.json"
DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_REPORT = ROOT / "data" / "sam_the_cooking_guy_completeness_report.json"


def complete_sam_catalog(
    *,
    catalog_path: Path | None = None,
    recipes_db: Path | None = None,
    report_path: Path | None = None,
    limit: int = 0,
) -> dict:
    cat_path = Path(catalog_path or DEFAULT_CATALOG)
    db_path = Path(recipes_db or DEFAULT_DB)
    out_path = Path(report_path or DEFAULT_REPORT)
    catalog = json.loads(cat_path.read_text(encoding="utf-8"))
    urls = [item["source_url"] for item in catalog.get("recipes") or []]
    if limit > 0:
        urls = urls[:limit]

    rows: list[dict] = []
    complete_n = 0
    for index, url in enumerate(urls, start=1):
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
        if index % 50 == 0 or index == len(urls):
            print(
                json.dumps(
                    {
                        "progress": index,
                        "total": len(urls),
                        "complete_so_far": complete_n,
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
    parser = argparse.ArgumentParser(description="Complete Sam catalog recipes.")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--limit", type=int, default=0, help="0 = all")
    args = parser.parse_args()
    report = complete_sam_catalog(
        catalog_path=args.catalog,
        recipes_db=args.db,
        report_path=args.report,
        limit=args.limit,
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
