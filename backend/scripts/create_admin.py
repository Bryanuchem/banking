from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

from sqlalchemy.exc import IntegrityError

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import SessionLocal  # noqa: E402
from app.services.admin_bootstrap_service import AdminBootstrapService  # noqa: E402


def _prompt_nonempty(label: str, supplied: str | None = None) -> str:
    value = supplied if supplied is not None else input(f"{label}: ")
    value = value.strip()
    if not value:
        raise ValueError(f"{label} is required.")
    return value


def _prompt_password() -> str:
    password = getpass.getpass("Password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        raise ValueError("Passwords do not match.")
    if not password:
        raise ValueError("Password is required.")
    return password


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create the first Banking administrator safely.",
    )
    parser.add_argument("--email", help="Administrator email address")
    parser.add_argument("--first-name", help="Administrator first name")
    parser.add_argument("--last-name", help="Administrator last name")
    parser.add_argument(
        "--promote-existing",
        action="store_true",
        help=(
            "Promote an existing Banking user with --email instead of "
            "creating a new identity. The existing password is preserved."
        ),
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db = SessionLocal()

    try:
        email = _prompt_nonempty("Email", args.email)

        if args.promote_existing:
            result = AdminBootstrapService.promote_existing(
                db,
                email=email,
            )
        else:
            first_name = _prompt_nonempty(
                "First name",
                args.first_name,
            )
            last_name = _prompt_nonempty(
                "Last name",
                args.last_name,
            )
            password = _prompt_password()

            result = AdminBootstrapService.create(
                db,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

    except (ValueError, IntegrityError) as exc:
        db.rollback()
        message = str(exc)
        if isinstance(exc, IntegrityError):
            message = "The administrator could not be created because a unique value already exists."
        print(f"\nAdmin bootstrap failed: {message}")
        return 1
    finally:
        db.close()

    user = result.user

    if result.created:
        outcome = "Administrator created."
    elif result.promoted:
        outcome = "Existing user promoted to administrator."
    else:
        outcome = "Administrator already exists. No changes made."

    print(f"\n{outcome}")
    print(f"Email: {user.email}")
    print(f"User ID: {user.id}")
    print(f"Active: {user.is_active}")
    print(f"Admin: {user.is_admin}")
    print(
        "Customer account: "
        + (
            user.account.account_number
            if user.account is not None
            else "None (admin-only identity)"
        )
    )
    print("\nYou can now sign in through POST /api/v1/auth/login and use the returned bearer token in Swagger.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
