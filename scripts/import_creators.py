#!/usr/bin/env python3
"""Load data/creators.json into data/recipes.sqlite."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "docs" / "database" / "0003_creators.sql"
SEED_PATH = ROOT / "data" / "creators.json"
DB_PATH = ROOT / "data" / "recipes.sqlite"

CATEGORIES = frozenset(
    {"influencer_pl", "chef_pl", "influencer_global", "chef_global"}
)
PRIMARY_SOURCES = frozenset(
    {"website", "youtube_description", "youtube_transcript"}
)
LANGUAGES = frozenset({"pl", "en"})
FIELDS = (
    "id",
    "name",
    "category",
    "primary_source",
    "website_url",
    "youtube_url",
    "youtube_channel_id",
    "language",
)


def load_seed(path: Path | None = None) -> list[tuple]:
    payload = json.loads((path or SEED_PATH).read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("creators.json must be a list")
    seen: set[str] = set()
    rows = []
    for item in payload:
        if not isinstance(item, dict):
            raise ValueError("each creator must be an object")
        extra = set(item) - set(FIELDS)
        if extra:
            raise ValueError(f"unknown fields: {sorted(extra)}")
        missing = [key for key in FIELDS if key not in item]
        if missing:
            raise ValueError(f"missing fields: {missing}")
        creator_id = str(item["id"] or "").strip()
        name = str(item["name"] or "").strip()
        category = item["category"]
        primary_source = item["primary_source"]
        language = item["language"]
        if not creator_id or not name:
            raise ValueError("each creator needs id and name")
        if creator_id in seen:
            raise ValueError(f"duplicate id: {creator_id}")
        if category not in CATEGORIES:
            raise ValueError(f"bad category: {category}")
        if primary_source not in PRIMARY_SOURCES:
            raise ValueError(f"bad primary_source: {primary_source}")
        if language not in LANGUAGES:
            raise ValueError(f"bad language: {language}")
        website_url = _opt_text(item["website_url"])
        youtube_url = _opt_text(item["youtube_url"])
        youtube_channel_id = _opt_text(item["youtube_channel_id"])
        if primary_source == "website" and not website_url:
            raise ValueError(f"{creator_id}: website primary_source needs website_url")
        seen.add(creator_id)
        rows.append(
            (
                creator_id,
                name,
                category,
                primary_source,
                website_url,
                youtube_url,
                youtube_channel_id,
                language,
            )
        )
    return rows


def _opt_text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def init_recipes_db(db_path: Path | None = None) -> Path:
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    conn = sqlite3.connect(path)
    try:
        conn.executescript(schema)
        cols = {row[1] for row in conn.execute("PRAGMA table_info(creators)")}
        if "youtube_url" not in cols:
            conn.execute("ALTER TABLE creators ADD COLUMN youtube_url TEXT")
        conn.commit()
    finally:
        conn.close()
    return path


def import_creators(
    seed_path: Path | None = None,
    db_path: Path | None = None,
) -> int:
    rows = load_seed(seed_path)
    path = init_recipes_db(db_path)
    conn = sqlite3.connect(path)
    try:
        conn.execute("DELETE FROM creators")
        conn.executemany(
            """
            INSERT INTO creators (
                creator_id, name, category, primary_source,
                website_url, youtube_url, youtube_channel_id, language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        conn.commit()
    finally:
        conn.close()
    return len(rows)


def main() -> None:
    n = import_creators()
    print(f"imported {n} creators into {DB_PATH}")


if __name__ == "__main__":
    main()
