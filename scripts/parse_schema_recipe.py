#!/usr/bin/env python3
"""Parse one recipe page (Schema.org JSON-LD) into data/recipes.sqlite."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.schema_recipe import parse_recipe_html, parse_url, save_recipe


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", help="recipe URL or path to an HTML file")
    parser.add_argument("--creator-id")
    parser.add_argument("--html", action="store_true", help="treat source as a local HTML file")
    args = parser.parse_args()
    if args.html or Path(args.source).is_file():
        html = Path(args.source).read_text(encoding="utf-8")
        recipe = parse_recipe_html(html, args.source)
        if recipe is None:
            raise SystemExit("no Schema.org/Recipe JSON-LD in file")
        save_recipe(recipe, creator_id=args.creator_id)
    else:
        recipe = parse_url(args.source, creator_id=args.creator_id)
    print(json.dumps(
        {
            "title": recipe["title"],
            "source_url": recipe["source_url"],
            "ingredients": len(recipe["ingredients"]),
            "prep_minutes": recipe["prep_minutes"],
            "cook_minutes": recipe["cook_minutes"],
        },
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
