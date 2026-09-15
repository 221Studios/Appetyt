from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Ingredient
from ..schemas import IngredientSearchOut
from ..serializers import ingredient_out

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=IngredientSearchOut)
def search_ingredients(
    q: str = Query(..., min_length=1, max_length=120),
    limit: int = Query(default=30, ge=1, le=100),
    session: Session = Depends(get_session),
) -> IngredientSearchOut:
    pattern = f"%{q.strip()}%"
    filters = or_(Ingredient.name_pl.ilike(pattern), Ingredient.name_en.ilike(pattern))
    total = session.scalar(select(func.count()).select_from(Ingredient).where(filters)) or 0
    rows = session.scalars(
        select(Ingredient).where(filters).order_by(Ingredient.name_pl, Ingredient.name_en).limit(limit)
    ).all()
    return IngredientSearchOut(items=[ingredient_out(row) for row in rows], total=total)
