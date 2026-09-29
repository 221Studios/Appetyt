"""Audit ingredient-section loss between the raw crawl and app export."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.ingredient_sections import ingredient_structure  # noqa: E402

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_APP_JSON = ROOT / "data" / "app_recipes.json"


def _raw_report(db_path: Path, sample_limit: int) -> dict:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    by_creator: dict[str, Counter[str]] = defaultdict(Counter)
    section_titles: Counter[str] = Counter()
    samples: list[dict] = []
    recipes = 0
    grouped_recipes = 0
    grouped_lines = 0
    ignored_lines = 0
    stored_missing = 0
    stored_mismatch = 0
    try:
        rows = connection.execute(
            "SELECT source_url, creator_id, title, ingredients_json, ingredient_sections_json "
            "FROM recipes"
        )
        for row in rows:
            recipes += 1
            lines = json.loads(row["ingredients_json"] or "[]")
            structure = ingredient_structure(lines)
            if not row["ingredient_sections_json"]:
                stored_missing += 1
            else:
                try:
                    stored = json.loads(row["ingredient_sections_json"])
                except json.JSONDecodeError:
                    stored = None
                if stored != structure:
                    stored_mismatch += 1
            groups = structure["groups"]
            titled_groups = [group for group in groups if group["title"] is not None]
            ignored = structure["ignored"]
            grouped_lines += sum(len(group["items"]) for group in titled_groups)
            ignored_lines += len(ignored)
            if titled_groups:
                grouped_recipes += 1
                creator = row["creator_id"] or "<unknown>"
                by_creator[creator]["recipes_with_sections"] += 1
                by_creator[creator]["section_lines"] += sum(
                    len(group["items"]) for group in titled_groups
                )
                for group in titled_groups:
                    section_titles[group["title"]] += 1
                if len(samples) < sample_limit:
                    samples.append(
                        {
                            "creator_id": row["creator_id"],
                            "title": row["title"],
                            "source_url": row["source_url"],
                            "groups": titled_groups,
                            "ignored": ignored,
                        }
                    )
    finally:
        connection.close()
    return {
        "recipes": recipes,
        "recipes_with_sections": grouped_recipes,
        "ingredient_lines_in_sections": grouped_lines,
        "ignored_non_ingredient_lines": ignored_lines,
        "stored_sections_missing": stored_missing,
        "stored_sections_mismatch": stored_mismatch,
        "by_creator": [
            {"creator_id": creator, **counts}
            for creator, counts in sorted(
                by_creator.items(), key=lambda item: (-item[1]["recipes_with_sections"], item[0])
            )
        ],
        "section_titles": [
            {"title": title, "occurrences": count}
            for title, count in section_titles.most_common(100)
        ],
        "samples": samples,
    }


def _app_report(app_json_path: Path, raw_urls_with_sections: set[str]) -> dict:
    payload = json.loads(app_json_path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("app JSON must contain a list")
    records_with_sections = 0
    grouped_raw_in_app = 0
    grouped_raw_missing_sections = 0
    samples: list[dict] = []
    for recipe in payload:
        if not isinstance(recipe, dict):
            continue
        sections = recipe.get("ingredient_sections")
        has_sections = isinstance(sections, list) and any(
            isinstance(group, dict) and group.get("title") for group in sections
        )
        if has_sections:
            records_with_sections += 1
        source_url = recipe.get("source_url")
        if source_url in raw_urls_with_sections:
            grouped_raw_in_app += 1
            if not has_sections:
                grouped_raw_missing_sections += 1
                if len(samples) < 20:
                    samples.append(
                        {
                            "id": recipe.get("id"),
                            "title": recipe.get("title"),
                            "source_url": source_url,
                        }
                    )
    return {
        "records": len(payload),
        "records_with_sections": records_with_sections,
        "raw_grouped_records_in_export": grouped_raw_in_app,
        "raw_grouped_records_missing_sections": grouped_raw_missing_sections,
        "missing_section_samples": samples,
    }


def build_report(
    db_path: Path = DEFAULT_DB,
    app_json_path: Path | None = DEFAULT_APP_JSON,
    sample_limit: int = 20,
) -> dict:
    raw = _raw_report(db_path, sample_limit)
    raw_urls_with_sections = {
        sample["source_url"] for sample in raw["samples"] if sample.get("source_url")
    }
    # The full URL set is loaded separately so strict mode is not limited to samples.
    connection = sqlite3.connect(db_path)
    try:
        raw_urls_with_sections = set()
        for source_url, ingredients_json in connection.execute(
            "SELECT source_url, ingredients_json FROM recipes"
        ):
            lines = json.loads(ingredients_json or "[]")
            if any(group["title"] for group in ingredient_structure(lines)["groups"]):
                raw_urls_with_sections.add(source_url)
    finally:
        connection.close()
    report = {"raw": raw}
    if app_json_path is not None and app_json_path.exists():
        report["app_export"] = _app_report(app_json_path, raw_urls_with_sections)
    else:
        report["app_export"] = None
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--app-json", type=Path, default=DEFAULT_APP_JSON)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sample-limit", type=int, default=20)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="exit 1 if a grouped raw recipe is flattened in the app export",
    )
    args = parser.parse_args()
    report = build_report(args.db, args.app_json, max(args.sample_limit, 0))
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(text, encoding="utf-8")
    print(text, end="")
    app_export = report.get("app_export") or {}
    if args.strict and app_export.get("raw_grouped_records_missing_sections", 0):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
