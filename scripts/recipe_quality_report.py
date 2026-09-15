#!/usr/bin/env python3
"""Quality snapshot of recipes.sqlite. Does not invent data."""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "recipes.sqlite"
OUT_PATH = ROOT / "docs" / "quality-report.md"
AGGREGATORS = ("smaker", "tasty", "epicurious", "serious_eats", "the_recipe_critic")


def report(db_path: Path) -> dict:
    conn = sqlite3.connect(db_path)
    try:
        total = conn.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
        rows = conn.execute(
            """
            SELECT creator_id,
                   COUNT(*) AS n,
                   AVG(json_array_length(ingredients_json)) AS avg_ing,
                   SUM(CASE WHEN json_array_length(ingredients_json) < 2 THEN 1 ELSE 0 END) AS weak
            FROM recipes
            GROUP BY creator_id
            ORDER BY n DESC
            """
        ).fetchall()
        samples = conn.execute(
            """
            SELECT creator_id, title, source_url, json_array_length(ingredients_json)
            FROM recipes
            WHERE creator_id IS NOT NULL
              AND creator_id NOT IN (?, ?, ?, ?, ?)
              AND json_array_length(ingredients_json) >= 2
            ORDER BY RANDOM()
            LIMIT 15
            """,
            AGGREGATORS,
        ).fetchall()
    finally:
        conn.close()
    by_creator = []
    agg_n = 0
    named_n = 0
    for creator_id, n, avg_ing, weak in rows:
        cid = creator_id or ""
        if cid in AGGREGATORS:
            agg_n += n
        else:
            named_n += n
        by_creator.append(
            {
                "creator_id": cid,
                "n": n,
                "avg_ingredients": round(avg_ing or 0, 2),
                "few_ingredients": weak,
                "aggregator": cid in AGGREGATORS,
            }
        )
    return {
        "total": total,
        "named": named_n,
        "aggregators": agg_n,
        "by_creator": by_creator,
        "samples": [
            {
                "creator_id": c,
                "title": t,
                "source_url": u,
                "ingredients": ing,
            }
            for c, t, u, ing in samples
        ],
    }


def render(data: dict) -> str:
    lines = [
        "# Raport jakości przepisów",
        "",
        f"Łącznie: {data['total']}. Named list: {data['named']}. Agregatory: {data['aggregators']}.",
        "",
        "## Sample (15, bez aggregatorów)",
        "",
    ]
    for item in data["samples"]:
        lines.append(
            f"- `{item['creator_id']}` — {item['title']} ({item['ingredients']} skł.) — {item['source_url']}"
        )
    lines.extend(["", "## Per twórca", ""])
    for row in data["by_creator"][:80]:
        flag = " AGG" if row["aggregator"] else ""
        lines.append(
            f"- `{row['creator_id']}`{flag}: {row['n']} (avg skł. {row['avg_ingredients']}, słabe {row['few_ingredients']})"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args()
    if not args.db.exists():
        raise SystemExit(f"no db {args.db}")
    data = report(args.db)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(render(data), encoding="utf-8")
    print(json.dumps({"total": data["total"], "named": data["named"], "aggregators": data["aggregators"]}))


if __name__ == "__main__":
    main()
