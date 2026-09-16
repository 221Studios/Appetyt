from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..costs import cost_for_store
from ..db import get_session
from ..models import PRODUCT_MODELS, Recipe, RecipeIngredient
from ..schemas import RecipeDetailOut, RecipeListOut, RecipeStepOut
from ..serializers import recipe_ingredient_out, recipe_summary

router = APIRouter(prefix="/recipes", tags=["recipes"])


def _options():
    return (
        selectinload(Recipe.creator),
        selectinload(Recipe.ingredients),
        selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient),
        selectinload(Recipe.steps),
    )


def _recipe_query():
    return select(Recipe).options(*_options())


@router.get("", response_model=RecipeListOut)
def list_recipes(
    q: str | None = Query(default=None, min_length=1, max_length=120),
    category: str | None = Query(default=None, max_length=120),
    creator_id: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> RecipeListOut:
    filters = []
    if q:
        pattern = f"%{q.strip()}%"
        filters.append(or_(Recipe.title.ilike(pattern), Recipe.subtitle.ilike(pattern)))
    if category:
        filters.append(Recipe.category == category)
    if creator_id:
        filters.append(Recipe.creator_id == creator_id)
    count_query = select(func.count()).select_from(Recipe).where(*filters)
    total = session.scalar(count_query) or 0
    rows = (
        session.scalars(_recipe_query().where(*filters).order_by(Recipe.id).offset(offset).limit(limit))
        .unique()
        .all()
    )
    return RecipeListOut(
        items=[recipe_summary(recipe) for recipe in rows], total=total, limit=limit, offset=offset
    )


@router.get("/{recipe_id}", response_model=RecipeDetailOut)
def recipe_detail(recipe_id: str, session: Session = Depends(get_session)) -> RecipeDetailOut:
    recipe = session.scalars(_recipe_query().where(Recipe.id == recipe_id)).unique().one_or_none()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    summary = recipe_summary(recipe)
    return RecipeDetailOut(
        **summary.model_dump(),
        ingredients=[recipe_ingredient_out(line) for line in recipe.ingredients],
        steps=[
            RecipeStepOut(
                step_number=step.step_number,
                title=step.title,
                instructions=step.instructions,
                duration_minutes=step.duration_minutes,
            )
            for step in recipe.steps
        ],
        costs=[cost_for_store(session, recipe, store) for store in PRODUCT_MODELS],
    )
