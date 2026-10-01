from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .. import auth as auth_service
from ..config import get_settings
from ..db import get_session
from ..models import RecipeSubmission, User
from ..recipe_images import LocalRecipeImageStore
from ..schemas import (
    AdminRecipeSubmissionOut,
    RecipeSubmissionApproveIn,
    RecipeSubmissionCreateIn,
    RecipeSubmissionOut,
    RecipeSubmissionRejectIn,
)
from ..submissions import (
    SubmissionError,
    admin_submission_payload,
    find_submission_for_user,
    normalize_url,
    publish_submission,
    submission_payload,
)

router = APIRouter(prefix="/recipe-submissions", tags=["recipe-submissions"])
admin_router = APIRouter(prefix="/admin/recipe-submissions", tags=["admin-recipe-submissions"])


def _current_user(
    request: Request, session: Session = Depends(get_session)
) -> User:
    return auth_service.require_current_user(request, session, get_settings())


def _admin_user(
    request: Request, session: Session = Depends(get_session)
) -> User:
    return auth_service.require_admin_user(request, session, get_settings())


def _load_submission(session: Session, submission_id: str) -> RecipeSubmission | None:
    return session.scalar(
        select(RecipeSubmission)
        .where(RecipeSubmission.id == submission_id)
        .options(selectinload(RecipeSubmission.attempts))
    )


@router.post("", response_model=RecipeSubmissionOut, status_code=status.HTTP_202_ACCEPTED)
def create_submission(
    payload: RecipeSubmissionCreateIn,
    user: User = Depends(_current_user),
    session: Session = Depends(get_session),
) -> RecipeSubmissionOut:
    try:
        normalized_url = normalize_url(payload.url)
    except SubmissionError as exc:
        raise HTTPException(status_code=422, detail=exc.detail) from exc

    settings = get_settings()
    since = datetime.now(timezone.utc) - timedelta(days=1)
    recent_count = session.scalar(
        select(func.count())
        .select_from(RecipeSubmission)
        .where(
            RecipeSubmission.submitted_by_user_id == user.id,
            RecipeSubmission.created_at >= since,
        )
    ) or 0
    if recent_count >= settings.recipe_submission_daily_limit:
        raise HTTPException(status_code=429, detail="Daily recipe submission limit reached")

    duplicate = session.scalar(
        select(RecipeSubmission).where(
            RecipeSubmission.normalized_url == normalized_url,
            RecipeSubmission.status.in_({"submitted", "processing", "awaiting_review", "approved"}),
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="This recipe link has already been submitted")

    now = datetime.now(timezone.utc)
    submission = RecipeSubmission(
        submitted_by_user_id=user.id,
        submitted_url=payload.url.strip(),
        normalized_url=normalized_url,
        status="submitted",
        created_at=now,
        updated_at=now,
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return RecipeSubmissionOut(**submission_payload(submission))


@router.get("", response_model=list[RecipeSubmissionOut])
def list_own_submissions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(_current_user),
    session: Session = Depends(get_session),
) -> list[RecipeSubmissionOut]:
    rows = session.scalars(
        select(RecipeSubmission)
        .where(RecipeSubmission.submitted_by_user_id == user.id)
        .options(selectinload(RecipeSubmission.attempts))
        .order_by(RecipeSubmission.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).unique().all()
    return [RecipeSubmissionOut(**submission_payload(row)) for row in rows]


@router.get("/{submission_id}", response_model=RecipeSubmissionOut)
def get_own_submission(
    submission_id: str,
    user: User = Depends(_current_user),
    session: Session = Depends(get_session),
) -> RecipeSubmissionOut:
    submission = find_submission_for_user(session, submission_id, user.id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Recipe submission not found")
    session.refresh(submission, attribute_names=["attempts"])
    return RecipeSubmissionOut(**submission_payload(submission))


@admin_router.get("", response_model=list[AdminRecipeSubmissionOut])
def list_admin_submissions(
    status_filter: str | None = Query(default=None, alias="status", max_length=32),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(_admin_user),
    session: Session = Depends(get_session),
) -> list[AdminRecipeSubmissionOut]:
    query = select(RecipeSubmission).options(selectinload(RecipeSubmission.attempts))
    if status_filter:
        query = query.where(RecipeSubmission.status == status_filter)
    rows = session.scalars(
        query.order_by(RecipeSubmission.created_at.asc()).offset(offset).limit(limit)
    ).unique().all()
    return [AdminRecipeSubmissionOut(**admin_submission_payload(row)) for row in rows]


@admin_router.get("/{submission_id}", response_model=AdminRecipeSubmissionOut)
def get_admin_submission(
    submission_id: str,
    _: User = Depends(_admin_user),
    session: Session = Depends(get_session),
) -> AdminRecipeSubmissionOut:
    submission = _load_submission(session, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Recipe submission not found")
    return AdminRecipeSubmissionOut(**admin_submission_payload(submission))


@admin_router.post("/{submission_id}/approve", response_model=AdminRecipeSubmissionOut)
def approve_submission(
    submission_id: str,
    payload: RecipeSubmissionApproveIn,
    admin: User = Depends(_admin_user),
    session: Session = Depends(get_session),
) -> AdminRecipeSubmissionOut:
    submission = _load_submission(session, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Recipe submission not found")
    try:
        normalize_url(payload.image_url) if payload.image_url else None
        publish_submission(
            session,
            submission,
            admin,
            title=payload.title,
            author_name=payload.author_name,
            image_url=payload.image_url,
            admin_note=payload.admin_note,
            image_store=LocalRecipeImageStore(get_settings()),
        )
    except SubmissionError as exc:
        raise HTTPException(status_code=409, detail=exc.detail) from exc
    session.commit()
    session.refresh(submission)
    return AdminRecipeSubmissionOut(**admin_submission_payload(submission))


@admin_router.post("/{submission_id}/image", response_model=AdminRecipeSubmissionOut)
def upload_submission_image(
    submission_id: str,
    image: UploadFile = File(...),
    _: User = Depends(_admin_user),
    session: Session = Depends(get_session),
) -> AdminRecipeSubmissionOut:
    submission = _load_submission(session, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Recipe submission not found")
    if submission.status != "awaiting_review":
        raise HTTPException(status_code=409, detail="Only a submission awaiting review can receive an image")
    try:
        image_url = LocalRecipeImageStore(get_settings()).from_upload(
            image.file, f"{submission.id}-manual"
        )
    except SubmissionError as exc:
        raise HTTPException(status_code=422, detail=exc.detail) from exc
    submission.image_override_url = image_url
    submission.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(submission)
    return AdminRecipeSubmissionOut(**admin_submission_payload(submission))


@admin_router.post("/{submission_id}/reject", response_model=AdminRecipeSubmissionOut)
def reject_submission(
    submission_id: str,
    payload: RecipeSubmissionRejectIn,
    admin: User = Depends(_admin_user),
    session: Session = Depends(get_session),
) -> AdminRecipeSubmissionOut:
    submission = _load_submission(session, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Recipe submission not found")
    if submission.status not in {"awaiting_review", "failed"}:
        raise HTTPException(status_code=409, detail="Only a pending submission can be rejected")
    submission.status = "rejected"
    submission.rejection_reason = payload.reason.strip()
    submission.reviewed_by_user_id = admin.id
    submission.reviewed_at = datetime.now(timezone.utc)
    submission.updated_at = submission.reviewed_at
    session.commit()
    return AdminRecipeSubmissionOut(**admin_submission_payload(submission))


@admin_router.post("/{submission_id}/retry", response_model=AdminRecipeSubmissionOut)
def retry_submission(
    submission_id: str,
    _: User = Depends(_admin_user),
    session: Session = Depends(get_session),
) -> AdminRecipeSubmissionOut:
    submission = _load_submission(session, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Recipe submission not found")
    if submission.status != "failed":
        raise HTTPException(status_code=409, detail="Only a failed submission can be retried")
    submission.status = "submitted"
    submission.last_error = None
    submission.updated_at = datetime.now(timezone.utc)
    session.commit()
    return AdminRecipeSubmissionOut(**admin_submission_payload(submission))
