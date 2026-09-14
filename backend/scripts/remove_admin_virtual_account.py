from __future__ import annotations

import argparse
import sys
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, or_, select

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import SessionLocal  # noqa: E402
from app.models.account import Account  # noqa: E402
from app.models.deposit import Deposit  # noqa: E402
from app.models.ledger_entry import LedgerEntry  # noqa: E402
from app.models.payment import Payment  # noqa: E402
from app.models.transfer import Transfer  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.withdrawal import Withdrawal  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Remove an unused virtual account from an admin-only identity. "
            "The command refuses accounts with money or financial history."
        ),
    )
    parser.add_argument(
        "--email",
        default="admin@admin.com",
        help="Administrator email address (default: admin@admin.com)",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip the interactive confirmation.",
    )
    return parser.parse_args()


def count(db, stmt) -> int:
    return int(db.scalar(stmt) or 0)


def main() -> int:
    args = parse_args()
    email = args.email.strip().lower()

    with SessionLocal() as db:
        user = db.scalar(
            select(User).where(User.email == email)
        )

        if user is None:
            print(f"No user exists with email {email}.")
            return 1

        if not user.is_admin:
            print(
                "Refusing to remove the account because this identity "
                "is not an administrator."
            )
            return 1

        account = db.scalar(
            select(Account).where(Account.user_id == user.id)
        )

        if account is None:
            print(
                f"{email} is already an admin-only identity. "
                "No virtual account exists."
            )
            return 0

        if (
            account.available_balance != Decimal("0.00")
            or account.held_balance != Decimal("0.00")
        ):
            print(
                "Refusing to delete the account because its balances "
                "are not zero."
            )
            return 1

        history = {
            "ledger entries": count(
                db,
                select(func.count())
                .select_from(LedgerEntry)
                .where(LedgerEntry.account_id == account.id),
            ),
            "transfers": count(
                db,
                select(func.count())
                .select_from(Transfer)
                .where(
                    or_(
                        Transfer.sender_account_id == account.id,
                        Transfer.recipient_account_id == account.id,
                    )
                ),
            ),
            "withdrawals": count(
                db,
                select(func.count())
                .select_from(Withdrawal)
                .where(Withdrawal.account_id == account.id),
            ),
            "deposits": count(
                db,
                select(func.count())
                .select_from(Deposit)
                .where(Deposit.account_id == account.id),
            ),
            "payments": count(
                db,
                select(func.count())
                .select_from(Payment)
                .where(Payment.user_id == user.id),
            ),
        }

        nonzero = {
            name: value
            for name, value in history.items()
            if value
        }

        if nonzero:
            details = ", ".join(
                f"{name}={value}"
                for name, value in nonzero.items()
            )
            print(
                "Refusing to delete the account because financial "
                f"history exists: {details}"
            )
            return 1

        print(f"Administrator: {email}")
        print(f"Account number: {account.account_number}")
        print("Available balance: 0.00")
        print("Held balance: 0.00")
        print("Financial history: none")

        if not args.yes:
            confirmation = input(
                "\nType REMOVE to delete this unused virtual account: "
            ).strip()
            if confirmation != "REMOVE":
                print("Cancelled.")
                return 1

        db.delete(account)
        db.commit()

        print(
            "\nUnused virtual account removed. "
            "The User identity and administrator privileges were preserved."
        )
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
