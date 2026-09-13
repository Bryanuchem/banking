from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.enums.ledger_entry_type import LedgerEntryType
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.account import Account
from app.models.ledger_entry import LedgerEntry
from app.models.withdrawal import Withdrawal

ZERO = Decimal("0.00")


class ReconciliationService:
    ACTIVE_HOLD_STATUSES = {
        WithdrawalStatus.AWAITING_FEE.value,
        WithdrawalStatus.FEE_PAID.value,
        WithdrawalStatus.PENDING_REVIEW.value,
        WithdrawalStatus.PROCESSING.value,
        WithdrawalStatus.PENDING.value,
    }

    @classmethod
    def account(cls, db: Session, account: Account) -> dict:
        expected_available = db.scalar(
            select(
                func.coalesce(
                    func.sum(
                        case(
                            (LedgerEntry.entry_type == LedgerEntryType.CREDIT.value, LedgerEntry.amount),
                            else_=-LedgerEntry.amount,
                        )
                    ),
                    ZERO,
                )
            ).where(LedgerEntry.account_id == account.id)
        ) or ZERO

        expected_held = db.scalar(
            select(func.coalesce(func.sum(Withdrawal.amount), ZERO)).where(
                Withdrawal.account_id == account.id,
                Withdrawal.status.in_(cls.ACTIVE_HOLD_STATUSES),
            )
        ) or ZERO

        expected_available = Decimal(expected_available).quantize(Decimal("0.01"))
        expected_held = Decimal(expected_held).quantize(Decimal("0.01"))
        actual_available = Decimal(account.available_balance).quantize(Decimal("0.01"))
        actual_held = Decimal(account.held_balance).quantize(Decimal("0.01"))

        return {
            "account_id": account.id,
            "account_number": account.account_number,
            "actual_available_balance": actual_available,
            "expected_available_balance": expected_available,
            "actual_held_balance": actual_held,
            "expected_held_balance": expected_held,
            "available_matches": actual_available == expected_available,
            "held_matches": actual_held == expected_held,
        }

    @classmethod
    def all_accounts(cls, db: Session) -> dict:
        results = [cls.account(db, account) for account in db.scalars(select(Account).order_by(Account.created_at)).all()]
        mismatched = sum(1 for item in results if not item["available_matches"] or not item["held_matches"])
        return {"checked": len(results), "mismatched": mismatched, "results": results}
