from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums.account_status import AccountStatus
from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.user import User


class AdminControlService:
    @staticmethod
    def set_user_active(db: Session, *, admin: User, user_id: UUID, is_active: bool, reason: str | None) -> User:
        user = db.scalar(select(User).where(User.id == user_id).with_for_update())
        if user is None:
            raise HTTPException(status_code=404, detail="User not found.")
        if user.id == admin.id and not is_active:
            raise HTTPException(status_code=409, detail="You cannot disable your own admin account.")
        user.is_active = is_active
        db.add(AuditLog(
            user_id=admin.id,
            action="user.activated" if is_active else "user.disabled",
            entity_type="user",
            entity_id=user.id,
            details={"reason": reason},
        ))
        db.flush()
        return user

    @staticmethod
    def set_account_status(db: Session, *, admin: User, account_id: UUID, status: str, reason: str | None) -> Account:
        if status not in {item.value for item in AccountStatus}:
            raise HTTPException(status_code=400, detail="Invalid account status.")
        account = db.scalar(select(Account).where(Account.id == account_id).with_for_update())
        if account is None:
            raise HTTPException(status_code=404, detail="Account not found.")
        if status == AccountStatus.CLOSED.value and (account.available_balance != 0 or account.held_balance != 0):
            raise HTTPException(status_code=409, detail="An account with funds or holds cannot be closed.")
        account.status = status
        db.add(AuditLog(
            user_id=admin.id,
            action=f"account.{status}",
            entity_type="account",
            entity_id=account.id,
            details={"reason": reason},
        ))
        db.flush()
        return account
