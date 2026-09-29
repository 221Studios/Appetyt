from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_session
from ..discovery import (
    DISCOVERY_GROUPS,
    DISCOVERY_TIMEZONE,
    current_edition_date,
    load_recipe_summaries,
    next_refresh_at,
    select_section_recipe_ids,
    select_top_recipe_ids,
)
from ..schemas import DiscoverHomeOut, DiscoverSectionOut
from ..serializers import recipe_summary

router = APIRouter(prefix="/discover", tags=["discover"])


@router.get("/home", response_model=DiscoverHomeOut)
def discover_home(
    edition_date: date | None = Query(default=None, alias="date"),
    session: Session = Depends(get_session),
) -> DiscoverHomeOut:
    edition = edition_date or current_edition_date()
    top_recipes = load_recipe_summaries(session, select_top_recipe_ids(session, edition))
    sections = []
    for group, title in DISCOVERY_GROUPS:
        recipe_ids = select_section_recipe_ids(session, group, edition)
        recipes = load_recipe_summaries(session, recipe_ids)
        sections.append(
            DiscoverSectionOut(
                id=group,
                title=title,
                items=[recipe_summary(recipe) for recipe in recipes],
            )
        )
    return DiscoverHomeOut(
        edition_date=edition,
        timezone=DISCOVERY_TIMEZONE.key,
        next_refresh_at=next_refresh_at(edition),
        top5=[recipe_summary(recipe) for recipe in top_recipes],
        sections=sections,
    )
