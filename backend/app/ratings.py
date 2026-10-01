from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from .models import RecipeRating

RATING_MIN = 1
RATING_MAX = 10


def rating_summary(session: Session, recipe_id: str, viewer_user_id: str | None = None) -> dict:
    counts = {str(score): 0 for score in range(RATING_MIN, RATING_MAX + 1)}
    grouped = session.execute(
        select(RecipeRating.score, func.count(RecipeRating.id))
        .where(RecipeRating.recipe_id == recipe_id)
        .group_by(RecipeRating.score)
    ).all()
    for score, count in grouped:
        counts[str(score)] = int(count)

    total = sum(counts.values())
    average = session.scalar(
        select(func.avg(RecipeRating.score)).where(RecipeRating.recipe_id == recipe_id)
    )
    viewer_score = None
    if viewer_user_id is not None:
        viewer_score = session.scalar(
            select(RecipeRating.score).where(
                RecipeRating.recipe_id == recipe_id,
                RecipeRating.user_id == viewer_user_id,
            )
        )
    return {
        "recipe_id": recipe_id,
        "average_score": round(float(average), 2) if average is not None else None,
        "rating_count": total,
        "distribution": counts,
        "viewer_score": int(viewer_score) if viewer_score is not None else None,
    }


def save_rating(session: Session, recipe_id: str, user_id: str, score: int) -> None:
    now = datetime.now(timezone.utc)
    rating = session.scalar(
        select(RecipeRating).where(
            RecipeRating.recipe_id == recipe_id,
            RecipeRating.user_id == user_id,
        )
    )
    if rating is None:
        session.add(
            RecipeRating(
                recipe_id=recipe_id,
                user_id=user_id,
                score=score,
                created_at=now,
                updated_at=now,
            )
        )
    else:
        rating.score = score
        rating.updated_at = now


def delete_rating(session: Session, recipe_id: str, user_id: str) -> None:
    rating = session.scalar(
        select(RecipeRating).where(
            RecipeRating.recipe_id == recipe_id,
            RecipeRating.user_id == user_id,
        )
    )
    if rating is not None:
        session.delete(rating)


def anonymize_user_ratings(session: Session, user_id: str) -> None:
    session.execute(
        update(RecipeRating)
        .where(RecipeRating.user_id == user_id)
        .values(user_id=None)
    )
