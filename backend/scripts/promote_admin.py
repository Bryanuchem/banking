from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import argparse

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.user import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Grant or revoke Banking administrator access.")
    parser.add_argument("email", help="User email address")
    parser.add_argument(
        "--revoke",
        action="store_true",
        help="Revoke administrator access instead of granting it",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            raise SystemExit(f"No user exists with email: {email}")

        user.is_admin = not args.revoke
        db.commit()

        state = "revoked from" if args.revoke else "granted to"
        print(f"Administrator access {state} {email}.")


if __name__ == "__main__":
    main()
