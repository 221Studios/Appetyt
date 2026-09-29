"""Shared rules for the home-page discovery feed."""

from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime, time, timedelta
from hashlib import sha256
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .models import DailyDiscovery, Recipe, RecipeTag

DISCOVERY_TIMEZONE = ZoneInfo("Europe/Warsaw")
DISCOVERY_GROUPS = (
    ("cuisine", "Typ kuchni"),
    ("diet", "Diety"),
    ("fast_food", "Fast food"),
    ("meal_type", "Typ posiłku"),
    ("other", "Inne"),
)
DISCOVERY_TOP_LIMIT = 5
DISCOVERY_SECTION_LIMIT = 10


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")


def current_edition_date(now: datetime | None = None) -> date:
    current = now or datetime.now(tz=DISCOVERY_TIMEZONE)
    if current.tzinfo is None:
        current = current.replace(tzinfo=DISCOVERY_TIMEZONE)
    return current.astimezone(DISCOVERY_TIMEZONE).date()


def next_refresh_at(edition_date: date) -> datetime:
    return datetime.combine(
        edition_date + timedelta(days=1), time.min, tzinfo=DISCOVERY_TIMEZONE
    )


def _daily_order(recipe_ids: list[str], edition_date: date) -> list[str]:
    return sorted(
        recipe_ids,
        key=lambda recipe_id: (
            sha256(f"{edition_date.isoformat()}:{recipe_id}".encode("utf-8")).hexdigest(),
            recipe_id,
        ),
    )


def _all_recipe_ids(session: Session) -> list[str]:
    return list(session.scalars(select(Recipe.id).order_by(Recipe.id)).all())


def select_top_recipe_ids(
    session: Session, edition_date: date, limit: int = DISCOVERY_TOP_LIMIT
) -> list[str]:
    """Return a stable daily selection, preferring an explicitly published edition."""
    if limit <= 0:
        return []

    available_ids = set(_all_recipe_ids(session))
    published_rows = session.scalars(
        select(DailyDiscovery)
        .where(DailyDiscovery.edition_date == edition_date)
        .order_by(DailyDiscovery.rank)
    ).all()
    selected: list[str] = []
    for row in published_rows:
        if row.recipe_id in available_ids and row.recipe_id not in selected:
            selected.append(row.recipe_id)
        if len(selected) == limit:
            return selected

    remaining = [recipe_id for recipe_id in available_ids if recipe_id not in selected]
    selected.extend(_daily_order(remaining, edition_date)[: limit - len(selected)])
    return selected


def select_section_recipe_ids(
    session: Session,
    group: str,
    edition_date: date,
    limit: int = DISCOVERY_SECTION_LIMIT,
) -> list[str]:
    if limit <= 0:
        return []
    recipe_ids = list(
        session.scalars(
            select(Recipe.id)
            .where(Recipe.tags.any(RecipeTag.group == group))
            .order_by(Recipe.id)
        ).all()
    )
    return _daily_order(recipe_ids, edition_date)[:limit]


def load_recipe_summaries(session: Session, recipe_ids: list[str]) -> list[Recipe]:
    """Load the small recipe projection needed by discovery cards in caller order."""
    if not recipe_ids:
        return []
    rows = session.scalars(
        select(Recipe)
        .where(Recipe.id.in_(recipe_ids))
        .options(
            selectinload(Recipe.creator),
            selectinload(Recipe.ingredients),
        )
    ).unique().all()
    by_id = {recipe.id: recipe for recipe in rows}
    return [by_id[recipe_id] for recipe_id in recipe_ids if recipe_id in by_id]
