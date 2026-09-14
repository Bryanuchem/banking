from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.enums.account_status import AccountStatus
from app.enums.deposit_status import DepositStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.deposit import Deposit
from app.models.user import User
from app.models.user_session import UserSession
from app.models.withdrawal import Withdrawal


class AccountDeletionService:
    TERMINAL_WITHDRAWAL_STATUSES = {
        WithdrawalStatus.COMPLETED.value,
        WithdrawalStatus.FAILED.value,
        WithdrawalStatus.REJECTED.value,
        WithdrawalStatus.CANCELLED.value,
    }
    TERMINAL_DEPOSIT_STATUSES = {
        DepositStatus.COMPLETED.value,
        DepositStatus.FAILED.value,
    }

    @staticmethod
    def _pending_withdrawals(
        db: Session,
        *,
        account_id: UUID,
    ) -> int:
        return int(
            db.scalar(
                select(func.count())
                .select_from(Withdrawal)
                .where(
                    Withdrawal.account_id == account_id,
                    Withdrawal.status.notin_(
                        AccountDeletionService.TERMINAL_WITHDRAWAL_STATUSES
                    ),
                )
            )
            or 0
        )

    @staticmethod
    def _pending_deposits(
        db: Session,
        *,
        account_id: UUID,
    ) -> int:
        return int(
            db.scalar(
                select(func.count())
                .select_from(Deposit)
                .where(
                    Deposit.account_id == account_id,
                    Deposit.status.notin_(
                        AccountDeletionService.TERMINAL_DEPOSIT_STATUSES
                    ),
                )
            )
            or 0
        )

    @classmethod
    def status(
        cls,
        db: Session,
        *,
        account: Account,
    ) -> dict[str, object]:
        pending_withdrawals = cls._pending_withdrawals(
            db,
            account_id=account.id,
        )
        pending_deposits = cls._pending_deposits(
            db,
            account_id=account.id,
        )

        can_delete = (
            account.deleted_at is None
            and account.available_balance == Decimal("0.00")
            and account.held_balance == Decimal("0.00")
            and pending_withdrawals == 0
            and pending_deposits == 0
        )

        clear_route = None
        if (
            account.available_balance != Decimal("0.00")
            or account.held_balance != Decimal("0.00")
            or pending_withdrawals > 0
        ):
            clear_route = "/withdraw"

        return {
            "account_number": account.account_number,
            "currency": account.currency,
            "available_balance": account.available_balance,
            "held_balance": account.held_balance,
            "pending_withdrawals": pending_withdrawals,
            "pending_deposits": pending_deposits,
            "can_delete": can_delete,
            "clear_route": clear_route,
        }

    @classmethod
    def delete(
        cls,
        db: Session,
        *,
        account_id: UUID,
        actor: User,
        confirmation: str,
        reason: str | None,
    ) -> tuple[Account, bool]:
        account = db.scalar(
            select(Account)
            .where(Account.id == account_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        if account is None:
            raise HTTPException(
                status_code=404,
                detail="Account not found.",
            )

        if account.deleted_at is not None:
            raise HTTPException(
                status_code=409,
                detail="This account has already been deleted.",
            )

        if confirmation.strip() != account.account_number:
            raise HTTPException(
                status_code=400,
                detail="Account-number confirmation does not match.",
            )

        state = cls.status(db, account=account)

        if account.available_balance != Decimal("0.00"):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "balance_not_zero",
                    "message": (
                        "Withdraw or clear the remaining available balance "
                        "before deleting this account."
                    ),
                    "available_balance": str(account.available_balance),
                    "held_balance": str(account.held_balance),
                    "route": "/withdraw",
                },
            )

        if account.held_balance != Decimal("0.00"):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "held_balance_not_zero",
                    "message": (
                        "This account still has held funds. Resolve or cancel "
                        "the pending withdrawal before deleting the account."
                    ),
                    "available_balance": str(account.available_balance),
                    "held_balance": str(account.held_balance),
                    "route": "/withdraw",
                },
            )

        if state["pending_withdrawals"] or state["pending_deposits"]:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "pending_operations",
                    "message": (
                        "Pending deposits or withdrawals must finish or be "
                        "cancelled before the account can be deleted."
                    ),
                    "pending_withdrawals": state["pending_withdrawals"],
                    "pending_deposits": state["pending_deposits"],
                    "route": state["clear_route"],
                },
            )

        owner = db.scalar(
            select(User)
            .where(User.id == account.user_id)
            .with_for_update()
        )
        if owner is None:
            raise HTTPException(
                status_code=409,
                detail="Account owner could not be resolved.",
            )

        now = datetime.now(UTC)
        account.status = AccountStatus.CLOSED.value
        account.deleted_at = now
        account.deletion_reason = reason.strip() if reason else None

        # A normal customer identity can no longer authenticate after deleting
        # its banking account. A dual-role administrator keeps admin access.
        user_deactivated = not owner.is_admin
        if user_deactivated:
            owner.is_active = False

            db.execute(
                update(UserSession)
                .where(
                    UserSession.user_id == owner.id,
                    UserSession.revoked_at.is_(None),
                )
                .values(revoked_at=now)
            )

        db.add(
            AuditLog(
                user_id=actor.id,
                action="account.deleted",
                entity_type="account",
                entity_id=account.id,
                details={
                    "owner_user_id": str(owner.id),
                    "account_number": account.account_number,
                    "reason": account.deletion_reason,
                    "history_preserved": True,
                    "user_deactivated": user_deactivated,
                },
            )
        )
        db.flush()

        return account, user_deactivated
