import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from .. import auth as auth_service
from ..config import get_settings
from ..costs import cost_for_store
from ..db import get_session
from ..models import PRODUCT_MODELS, Recipe, RecipeIngredient
from ..ratings import delete_rating, rating_summary, save_rating
from ..schemas import RecipeDetailOut, RecipeListOut, RecipeRatingIn, RecipeRatingOut, RecipeStepOut
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
    source_kind: str | None = Query(default=None, max_length=40),
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
    if source_kind:
        filters.append(Recipe.source_kind == source_kind)
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


@router.get("/{recipe_id}/rating", response_model=RecipeRatingOut)
def recipe_rating(
    recipe_id: str,
    request: Request,
    session: Session = Depends(get_session),
) -> RecipeRatingOut:
    if session.get(Recipe, recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    viewer = auth_service.current_user_if_present(request, session, get_settings())
    return RecipeRatingOut(
        **rating_summary(session, recipe_id, viewer.id if viewer is not None else None)
    )


@router.put("/{recipe_id}/rating", response_model=RecipeRatingOut)
def set_recipe_rating(
    recipe_id: str,
    payload: RecipeRatingIn,
    request: Request,
    session: Session = Depends(get_session),
) -> RecipeRatingOut:
    if session.get(Recipe, recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    user = auth_service.current_user(request, session, get_settings())
    save_rating(session, recipe_id, user.id, payload.score)
    session.commit()
    return RecipeRatingOut(**rating_summary(session, recipe_id, user.id))


@router.delete("/{recipe_id}/rating", status_code=204)
def remove_recipe_rating(
    recipe_id: str,
    request: Request,
    session: Session = Depends(get_session),
) -> None:
    if session.get(Recipe, recipe_id) is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    user = auth_service.current_user(request, session, get_settings())
    delete_rating(session, recipe_id, user.id)
    session.commit()


@router.get("/{recipe_id}", response_model=RecipeDetailOut)
def recipe_detail(recipe_id: str, session: Session = Depends(get_session)) -> RecipeDetailOut:
    recipe = session.scalars(_recipe_query().where(Recipe.id == recipe_id)).unique().one_or_none()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    summary = recipe_summary(recipe)
    source_steps: list[str] = []
    if recipe.source_steps_json:
        try:
            loaded = json.loads(recipe.source_steps_json)
            if isinstance(loaded, list):
                source_steps = [str(item) for item in loaded]
        except json.JSONDecodeError:
            source_steps = []
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
        source_steps=source_steps,
        costs=(
            []
            if recipe.source_kind == "user_submitted_link"
            else [cost_for_store(session, recipe, store) for store in PRODUCT_MODELS]
        ),
    )
