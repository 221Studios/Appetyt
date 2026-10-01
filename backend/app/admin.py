"""Small operational commands for Appetyt administrators."""

from __future__ import annotations

import argparse

from sqlalchemy import select

from .db import SessionLocal
from .models import User


def promote_admin(google_subject: str) -> None:
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.google_subject == google_subject.strip()))
        if user is None:
            raise SystemExit("No Appetyt account exists for this Google subject; log in once first.")
        user.is_admin = True
        session.commit()
        print(f"Promoted user {user.id} to admin")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--google-subject", required=True)
    args = parser.parse_args()
    promote_admin(args.google_subject)


if __name__ == "__main__":
    main()
