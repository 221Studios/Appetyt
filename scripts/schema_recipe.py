"""Parse Schema.org/Recipe JSON-LD from raw HTML. No per-site scrapers."""

from __future__ import annotations

import json
import re
import sqlite3
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_RECIPES = ROOT / "docs" / "database" / "0005_recipes.sql"
DB_PATH = ROOT / "data" / "recipes.sqlite"

LD_JSON_RE = re.compile(
    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
DURATION_RE = re.compile(
    r"^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$"
)
USER_AGENT = "Appetyt/0.1 (recipe JSON-LD parser; +https://localhost)"


def _as_list(value: object) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _text(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        text = unescape(value).strip()
        return text or None
    if isinstance(value, dict):
        for key in ("name", "text", "@value"):
            inner = _text(value.get(key))
            if inner:
                return inner
    return str(value).strip() or None


def is_schema_type(node: object, type_name: str) -> bool:
    if not isinstance(node, dict):
        return False
    types = _as_list(node.get("@type"))
    needle = type_name.lower()
    for item in types:
        if not isinstance(item, str):
            continue
        short = item.rsplit("/", 1)[-1].lower()
        if short == needle:
            return True
    return False


def walk_nodes(payload: object) -> list[dict]:
    found: list[dict] = []

    def visit(node: object) -> None:
        if isinstance(node, list):
            for item in node:
                visit(item)
            return
        if not isinstance(node, dict):
            return
        found.append(node)
        if "@graph" in node:
            visit(node["@graph"])

    visit(payload)
    return found


def iso8601_minutes(value: object) -> int | None:
    if isinstance(value, dict):
        value = value.get("@value") or value.get("name")
    if not isinstance(value, str):
        return None
    text = value.strip().upper()
    match = DURATION_RE.fullmatch(text)
    if not match:
        return None
    days, hours, minutes, seconds = match.groups()
    total = 0.0
    if days:
        total += int(days) * 24 * 60
    if hours:
        total += int(hours) * 60
    if minutes:
        total += int(minutes)
    if seconds:
        total += float(seconds) / 60.0
    if total <= 0:
        return None
    return int(round(total))


def extract_ld_json_blocks(html: str) -> list[object]:
    blocks = []
    for raw in LD_JSON_RE.findall(html):
        text = unescape(raw).strip()
        text = re.sub(r"^\s*<!--", "", text)
        text = re.sub(r"-->\s*$", "", text).strip()
        if not text:
            continue
        try:
            blocks.append(json.loads(text))
        except json.JSONDecodeError:
            continue
    return blocks


def find_recipe_node(html: str) -> dict | None:
    for block in extract_ld_json_blocks(html):
        for node in walk_nodes(block):
            if is_schema_type(node, "Recipe"):
                return node
    return None


def _ingredient_lines(node: dict) -> list[str]:
    lines = []
    for item in _as_list(node.get("recipeIngredient")):
        text = _text(item)
        if text:
            lines.append(text)
    return lines


def _instruction_lines(node: dict) -> list[str]:
    lines: list[str] = []

    def visit(item: object) -> None:
        if item is None:
            return
        if isinstance(item, str):
            text = unescape(item).strip()
            if text:
                lines.append(text)
            return
        if isinstance(item, list):
            for child in item:
                visit(child)
            return
        if not isinstance(item, dict):
            return
        if is_schema_type(item, "HowToSection"):
            visit(item.get("itemListElement"))
            return
        if is_schema_type(item, "HowToStep") or is_schema_type(item, "HowToDirection"):
            text = _text(item.get("text")) or _text(item.get("name"))
            if text:
                lines.append(text)
            return
        text = _text(item.get("text")) or _text(item.get("name"))
        if text:
            lines.append(text)

    visit(node.get("recipeInstructions"))
    return lines


def parse_recipe_html(html: str, source_url: str) -> dict | None:
    node = find_recipe_node(html)
    if node is None:
        return None
    title = _text(node.get("name"))
    ingredients = _ingredient_lines(node)
    if not title or not ingredients:
        return None
    yield_value = node.get("recipeYield")
    if isinstance(yield_value, list) and yield_value:
        yield_value = yield_value[0]
    canonical = _text(node.get("url")) or source_url
    steps = _instruction_lines(node)
    return {
        "title": title,
        "source_url": canonical,
        "prep_minutes": iso8601_minutes(node.get("prepTime")),
        "cook_minutes": iso8601_minutes(node.get("cookTime")),
        "total_minutes": iso8601_minutes(node.get("totalTime")),
        "recipe_yield": _text(yield_value),
        "ingredients": ingredients,
        "source_steps": steps,
    }


def fetch_html(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        raw = response.read()
        charset = response.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, errors="replace")


def init_recipes_tables(db_path: Path | None = None) -> Path:
    from scripts.import_creators import init_recipes_db

    path = init_recipes_db(db_path)
    conn = sqlite3.connect(path)
    try:
        conn.executescript(SCHEMA_RECIPES.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()
    return path


def save_recipe(
    recipe: dict,
    creator_id: str | None = None,
    db_path: Path | None = None,
    fetched_at: str | None = None,
) -> str:
    path = init_recipes_tables(db_path)
    when = fetched_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    source_url = recipe["source_url"]
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO recipes (
                source_url, creator_id, title, prep_minutes, cook_minutes,
                total_minutes, recipe_yield, ingredients_json, source_steps_json,
                fetched_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                source_url,
                creator_id,
                recipe["title"],
                recipe["prep_minutes"],
                recipe["cook_minutes"],
                recipe["total_minutes"],
                recipe["recipe_yield"],
                json.dumps(recipe["ingredients"], ensure_ascii=False),
                json.dumps(recipe["source_steps"], ensure_ascii=False),
                when,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return source_url


def parse_url(
    url: str,
    creator_id: str | None = None,
    db_path: Path | None = None,
) -> dict:
    html = fetch_html(url)
    recipe = parse_recipe_html(html, url)
    if recipe is None:
        raise ValueError(f"no Schema.org/Recipe JSON-LD in {url}")
    save_recipe(recipe, creator_id=creator_id, db_path=db_path)
    return recipe
