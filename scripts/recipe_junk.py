"""Flag and delete non-recipes. Cookie baking stays; privacy/footer/HTML dumps go."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "recipes.sqlite"

MAX_INGREDIENTS = 48
HTML_RE = re.compile(r"</?[a-zA-Z][^>]*>")
JUNK_TITLE_RE = re.compile(
    r"(polityka prywatno|plik[oó]w cookies|privacy policy|cookie policy|"
    r"^kuchnia lidla$|^regulamin$|^kontakt$|^compliance$|"
    r"^bio$|^home$|^anne$)",
    re.IGNORECASE,
)
NAV_INGREDIENT_RE = re.compile(
    r"^(regulamin|kontakt|compliance|polityka (dostępności|prywatności)|"
    r"newsletter|facebook|instagram|dołącz do nas)",
    re.IGNORECASE,
)


def junk_reason(recipe: dict) -> str | None:
    title = (recipe.get("title") or "").strip()
    ingredients = [str(x).strip() for x in (recipe.get("ingredients") or []) if str(x).strip()]
    if len(title) < 3:
        return "short_title"
    if JUNK_TITLE_RE.search(title):
        return "junk_title"
    url = recipe.get("source_url") or ""
    host = urlparse(url).netloc.lower().removeprefix("www.")
    path = urlparse(url).path or ""
    if host.endswith("aniastarmach.pl") and "/przepisy/" in path:
        return "listing_url"
    if len(ingredients) < 2:
        return "few_ingredients"
    if len(ingredients) > MAX_INGREDIENTS:
        return "too_many_ingredients"
    if any(HTML_RE.search(line) for line in ingredients):
        return "html_ingredients"
    nav_hits = sum(1 for line in ingredients if NAV_INGREDIENT_RE.match(line))
    if nav_hits >= 2:
        return "nav_ingredients"
    return None


def _load_ingredients(raw: str) -> list[str]:
    try:
        value = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(value, list):
        return []
    return [str(x) for x in value]


def cleanup_recipes(db_path: Path | None = None) -> dict:
    path = db_path or DB_PATH
    conn = sqlite3.connect(path)
    deleted_junk = 0
    try:
        rows = conn.execute(
            "SELECT source_url, creator_id, title, ingredients_json FROM recipes"
        ).fetchall()
        junk_urls = []
        for source_url, creator_id, title, ingredients_json in rows:
            recipe = {
                "title": title,
                "ingredients": _load_ingredients(ingredients_json),
                "source_url": source_url,
            }
            if junk_reason(recipe):
                junk_urls.append(source_url)
        if junk_urls:
            conn.executemany(
                "DELETE FROM recipes WHERE source_url = ?",
                [(url,) for url in junk_urls],
            )
            deleted_junk = len(junk_urls)

        dup_rows = conn.execute(
            """
            SELECT creator_id, title, ingredients_json, COUNT(*) AS c
            FROM recipes
            GROUP BY creator_id, title, ingredients_json
            HAVING c > 1
            """
        ).fetchall()
        deleted_dupes = 0
        for creator_id, title, ingredients_json, _c in dup_rows:
            urls = [
                row[0]
                for row in conn.execute(
                    """
                    SELECT source_url FROM recipes
                    WHERE creator_id IS ? AND title = ? AND ingredients_json = ?
                    ORDER BY length(source_url) ASC, source_url ASC
                    """,
                    (creator_id, title, ingredients_json),
                )
            ]
            for extra in urls[1:]:
                conn.execute("DELETE FROM recipes WHERE source_url = ?", (extra,))
                deleted_dupes += 1
        conn.commit()
    finally:
        conn.close()
    return {"deleted_junk": deleted_junk, "deleted_dupes": deleted_dupes}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=DB_PATH)
    args = parser.parse_args()
    if not args.db.exists():
        raise SystemExit(f"no db {args.db}")
    result = cleanup_recipes(args.db)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
