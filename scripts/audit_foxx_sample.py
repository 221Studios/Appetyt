"""Audit 10 losowych przepisów Foxxa: kanoniczny snapshot vs publiczna strona."""

from __future__ import annotations

import argparse
import json
import random
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.html_recipe import parse_html_recipe
from scripts.schema_recipe import fetch_html

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_OUT = ROOT / "data" / "foxx_gotuje_audit10.json"
CREATOR_ID = "foxx_gotuje"


def _norm(text: str) -> str:
    return " ".join((text or "").lower().split())


def compare_recipe(canonical: dict, live: dict | None) -> dict:
    """Porównaj linie i obecność kroków źródłowych (seam audytu)."""
    stored_ings = [_norm(x) for x in (canonical.get("ingredients") or [])]
    live_ings = [_norm(x) for x in ((live or {}).get("ingredients") or [])]
    stored_set = set(stored_ings)
    live_set = set(live_ings)
    overlap = stored_set & live_set
    coverage = (len(overlap) / len(stored_set)) if stored_set else 0.0
    stored_steps = canonical.get("source_steps") or []
    live_steps = (live or {}).get("source_steps") or []
    issues: list[str] = []
    if live is None:
        issues.append("live_parse_failed")
    if coverage < 0.7:
        issues.append(f"ingredient_coverage:{coverage:.2f}")
    if not stored_steps:
        issues.append("canonical_missing_steps")
    if live is not None and not live_steps:
        issues.append("live_missing_steps")
    return {
        "ingredient_coverage": round(coverage, 3),
        "stored_ingredient_count": len(stored_ings),
        "live_ingredient_count": len(live_ings),
        "stored_step_count": len(stored_steps),
        "live_step_count": len(live_steps),
        "only_in_canonical": sorted(stored_set - live_set)[:12],
        "only_on_page": sorted(live_set - stored_set)[:12],
        "issues": issues,
        "pass": not issues,
    }


def audit_foxx_sample(
    *,
    recipes_db: Path | None = None,
    sample_size: int = 10,
    seed: int = 18,
    fetch=fetch_html,
) -> dict:
    db = Path(recipes_db or DEFAULT_DB)
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT source_url, title, ingredients_json, source_steps_json "
        "FROM recipes WHERE creator_id = ? ORDER BY source_url",
        (CREATOR_ID,),
    ).fetchall()
    conn.close()
    if len(rows) < sample_size:
        raise ValueError(f"need >= {sample_size} foxx recipes, found {len(rows)}")
    picked = random.Random(seed).sample(list(rows), sample_size)
    results = []
    for row in picked:
        ingredients = json.loads(row["ingredients_json"] or "[]")
        steps = json.loads(row["source_steps_json"] or "[]")
        canonical = {
            "title": row["title"],
            "source_url": row["source_url"],
            "ingredients": ingredients,
            "source_steps": steps,
        }
        try:
            html = fetch(row["source_url"])
            live = parse_html_recipe(html, row["source_url"])
        except Exception:
            live = None
        comparison = compare_recipe(canonical, live)
        results.append(
            {
                "source_url": row["source_url"],
                "title": row["title"],
                **comparison,
            }
        )
    passed = sum(1 for item in results if item["pass"])
    return {
        "schema_version": 1,
        "creator_id": CREATOR_ID,
        "audited_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sample_size": sample_size,
        "seed": seed,
        "passed": passed,
        "failed": sample_size - passed,
        "creator_closed": passed == sample_size,
        "recipes": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit 10 Foxx recipes vs live pages.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--sample-size", type=int, default=10)
    parser.add_argument("--seed", type=int, default=18)
    args = parser.parse_args()
    report = audit_foxx_sample(
        recipes_db=args.db,
        sample_size=args.sample_size,
        seed=args.seed,
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(
        json.dumps(
            {
                "passed": report["passed"],
                "failed": report["failed"],
                "creator_closed": report["creator_closed"],
                "path": str(args.out),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
