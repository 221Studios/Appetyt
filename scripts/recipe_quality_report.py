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
        strong = conn.execute(
            "SELECT COUNT(*) FROM recipes WHERE json_array_length(ingredients_json) >= 2"
        ).fetchone()[0]
        rows = conn.execute(
            """
            SELECT creator_id,
                   COUNT(*) AS n,
                   AVG(json_array_length(ingredients_json)) AS avg_ing,
                   SUM(CASE WHEN json_array_length(ingredients_json) < 2 THEN 1 ELSE 0 END) AS weak,
                   SUM(CASE WHEN json_array_length(ingredients_json) >= 2 THEN 1 ELSE 0 END) AS ok
            FROM recipes
            GROUP BY creator_id
            ORDER BY n DESC
            """
        ).fetchall()
        dup_rows = conn.execute(
            """
            SELECT creator_id, title, COUNT(*) AS c
            FROM recipes
            GROUP BY creator_id, title
            HAVING c > 1
            ORDER BY c DESC
            LIMIT 40
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
    for creator_id, n, avg_ing, weak, ok in rows:
        cid = creator_id or ""
        if cid in AGGREGATORS:
            agg_n += n
        else:
            named_n += n
        pct = round(100.0 * ok / n, 1) if n else 0.0
        by_creator.append(
            {
                "creator_id": cid,
                "n": n,
                "avg_ingredients": round(avg_ing or 0, 2),
                "few_ingredients": weak,
                "pct_ge2": pct,
                "aggregator": cid in AGGREGATORS,
            }
        )
    return {
        "total": total,
        "named": named_n,
        "aggregators": agg_n,
        "pct_ge2": round(100.0 * strong / total, 1) if total else 0.0,
        "duplicate_titles": [
            {"creator_id": c or "", "title": t, "count": n} for c, t, n in dup_rows
        ],
        "by_creator": by_creator,
        "samples": [
            {
                "creator_id": c,
                "title": t,
                "source_url": u,
                "ingredients": ing,
                "verdict": "wygląda jak przepis",
            }
            for c, t, u, ing in samples
        ],
    }


def render(data: dict) -> str:
    lines = [
        "# Raport jakości przepisów",
        "",
        (
            f"Łącznie: {data['total']}. Named list: {data['named']}. "
            f"Agregatory: {data['aggregators']}. "
            f"% z ≥2 składnikami: {data['pct_ge2']}."
        ),
        "",
        "## Sample (15, bez aggregatorów)",
        "",
        "Ręczna ocena: `wygląda jak przepis` / `śmieć` (auto: ≥2 skł. → wygląda jak przepis).",
        "",
    ]
    for item in data["samples"]:
        lines.append(
            f"- `{item['creator_id']}` — {item['title']} "
            f"({item['ingredients']} skł.) — **{item['verdict']}** — {item['source_url']}"
        )
    lines.extend(["", "## Duplikaty tytułów (top)", ""])
    if not data["duplicate_titles"]:
        lines.append("- brak")
    for row in data["duplicate_titles"][:20]:
        lines.append(
            f"- `{row['creator_id']}` — {row['title']} ×{row['count']}"
        )
    lines.extend(["", "## Per twórca", ""])
    for row in data["by_creator"][:80]:
        flag = " AGG" if row["aggregator"] else ""
        lines.append(
            f"- `{row['creator_id']}`{flag}: {row['n']} "
            f"({row['pct_ge2']}% ≥2 skł., avg {row['avg_ingredients']}, słabe {row['few_ingredients']})"
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
