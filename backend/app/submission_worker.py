"""Small database-backed worker for recipe-link submissions."""

from __future__ import annotations

import argparse
import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import RecipeSubmission
from .submissions import HttpxPageFetcher, process_submission


def process_one(session: Session) -> bool:
    submission = session.scalar(
        select(RecipeSubmission)
        .where(RecipeSubmission.status == "submitted")
        .order_by(RecipeSubmission.created_at)
        .limit(1)
    )
    if submission is None:
        return False
    process_submission(session, submission, HttpxPageFetcher())
    session.commit()
    return True


def run_worker(poll_seconds: float = 3.0) -> None:
    while True:
        with SessionLocal() as session:
            processed = process_one(session)
        if not processed:
            time.sleep(poll_seconds)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="Process at most one queued submission")
    parser.add_argument("--poll-seconds", type=float, default=3.0)
    args = parser.parse_args()
    if args.once:
        with SessionLocal() as session:
            process_one(session)
        return
    run_worker(args.poll_seconds)


if __name__ == "__main__":
    main()
