from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_session
from ..models import Creator, Recipe
from ..schemas import CreatorOut, RecipeListOut
from ..serializers import creator_out, recipe_summary

router = APIRouter(prefix="/creators", tags=["creators"])


@router.get("", response_model=list[CreatorOut])
def list_creators(
    q: str | None = Query(default=None, min_length=1, max_length=120),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_session),
) -> list[CreatorOut]:
    query = select(Creator).options(selectinload(Creator.recipes)).order_by(Creator.name).limit(limit)
    if q:
        query = query.where(Creator.name.ilike(f"%{q.strip()}%"))
    return [creator_out(row) for row in session.scalars(query).unique().all()]


@router.get("/{creator_id}/recipes", response_model=RecipeListOut)
def creator_recipes(creator_id: str, session: Session = Depends(get_session)) -> RecipeListOut:
    creator = session.get(Creator, creator_id)
    if creator is None:
        raise HTTPException(status_code=404, detail="Creator not found")
    rows = (
        session.scalars(
            select(Recipe)
            .where(Recipe.creator_id == creator_id)
            .options(selectinload(Recipe.creator), selectinload(Recipe.ingredients))
            .order_by(Recipe.title)
        )
        .unique()
        .all()
    )
    return RecipeListOut(
        items=[recipe_summary(row) for row in rows], total=len(rows), limit=len(rows), offset=0
    )
