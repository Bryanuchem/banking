from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, joinedload

from app.constants.setting_key import SettingKeys
from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.ledger_entry import LedgerEntry
from app.models.transaction import Transaction
from app.models.two_factor_settings import TwoFactorSettings
from app.models.user import User
from app.models.user_session import UserSession
from app.services.reconciliation_service import ReconciliationService
from app.services.setting_service import SettingService
from app.utils.security import hash_password, validate_password_policy


class AdminSecurityService:
    @staticmethod
    def _active_session_predicate(now: datetime):
        return (
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )

    @classmethod
    def overview(cls, db: Session) -> dict:
        now = datetime.now(UTC)
        admin_count = int(
            db.scalar(
                select(func.count())
                .select_from(User)
                .where(User.is_admin.is_(True))
            )
            or 0
        )
        active_sessions = int(
            db.scalar(
                select(func.count())
                .select_from(UserSession)
                .join(User, User.id == UserSession.user_id)
                .where(
                    User.is_admin.is_(True),
                    *cls._active_session_predicate(now),
                )
            )
            or 0
        )
        admins_without_2fa = int(
            db.scalar(
                select(func.count())
                .select_from(User)
                .outerjoin(
                    TwoFactorSettings,
                    TwoFactorSettings.user_id == User.id,
                )
                .where(
                    User.is_admin.is_(True),
                    or_(
                        TwoFactorSettings.id.is_(None),
                        TwoFactorSettings.enabled.is_(False),
                    ),
                )
            )
            or 0
        )
        failed_attempts = int(
            db.scalar(
                select(
                    func.coalesce(
                        func.sum(User.failed_login_attempts),
                        0,
                    )
                ).where(User.is_admin.is_(True))
            )
            or 0
        )

        reconciliation = ReconciliationService.all_accounts(db)
        mismatched = int(reconciliation["mismatched"])
        checked = int(reconciliation["checked"])
        status = (
            "healthy"
            if mismatched == 0
            else "warning"
            if mismatched <= 2
            else "critical"
        )

        return {
            "summary": {
                "administrators": admin_count,
                "active_admin_sessions": active_sessions,
                "admins_without_2fa": admins_without_2fa,
                "failed_admin_attempts": failed_attempts,
                "reconciliation_status": status,
                "reconciliation_checked": checked,
                "reconciliation_mismatched": mismatched,
            },
            "policy": {
                "password_min_length": SettingService.get_integer(
                    db,
                    SettingKeys.PASSWORD_MIN_LENGTH,
                    8,
                ),
                "require_uppercase": SettingService.get_boolean(
                    db,
                    SettingKeys.REQUIRE_UPPERCASE,
                    True,
                ),
                "require_numbers": SettingService.get_boolean(
                    db,
                    SettingKeys.REQUIRE_NUMBERS,
                    True,
                ),
                "require_special_characters": SettingService.get_boolean(
                    db,
                    SettingKeys.REQUIRE_SPECIAL_CHARACTERS,
                    True,
                ),
                "two_factor_policy": SettingService.get_string(
                    db,
                    SettingKeys.TWO_FACTOR_AUTH_POLICY,
                    "optional",
                ),
            },
        }

    @classmethod
    def administrators(
        cls,
        db: Session,
        *,
        q: str | None,
        status: str | None,
        two_factor: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[dict], int]:
        now = datetime.now(UTC)

        active_sessions_subq = (
            select(
                UserSession.user_id.label("user_id"),
                func.count(UserSession.id).label("active_sessions"),
            )
            .where(*cls._active_session_predicate(now))
            .group_by(UserSession.user_id)
            .subquery()
        )

        stmt = (
            select(
                User,
                TwoFactorSettings.enabled,
                func.coalesce(
                    active_sessions_subq.c.active_sessions,
                    0,
                ),
            )
            .outerjoin(
                TwoFactorSettings,
                TwoFactorSettings.user_id == User.id,
            )
            .outerjoin(
                active_sessions_subq,
                active_sessions_subq.c.user_id == User.id,
            )
            .where(User.is_admin.is_(True))
        )

        count_stmt = (
            select(func.count())
            .select_from(User)
            .outerjoin(
                TwoFactorSettings,
                TwoFactorSettings.user_id == User.id,
            )
            .where(User.is_admin.is_(True))
        )

        if q:
            term = f"%{q.strip()}%"
            predicate = or_(
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)

        if status == "active":
            stmt = stmt.where(User.is_active.is_(True))
            count_stmt = count_stmt.where(User.is_active.is_(True))
        elif status == "disabled":
            stmt = stmt.where(User.is_active.is_(False))
            count_stmt = count_stmt.where(User.is_active.is_(False))

        if two_factor == "enabled":
            stmt = stmt.where(TwoFactorSettings.enabled.is_(True))
            count_stmt = count_stmt.where(
                TwoFactorSettings.enabled.is_(True)
            )
        elif two_factor == "disabled":
            predicate = or_(
                TwoFactorSettings.id.is_(None),
                TwoFactorSettings.enabled.is_(False),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)

        total = int(db.scalar(count_stmt) or 0)
        rows = db.execute(
            stmt.order_by(
                User.first_name.asc(),
                User.last_name.asc(),
                User.email.asc(),
            )
            .limit(limit)
            .offset(offset)
        ).all()

        items = []
        for user, two_factor_enabled, active_sessions in rows:
            items.append(
                {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "is_active": user.is_active,
                    "two_factor_enabled": bool(two_factor_enabled),
                    "active_sessions": int(active_sessions or 0),
                    "last_login_at": user.last_login_at,
                    "created_at": user.created_at,
                    "has_customer_account": user.account is not None,
                }
            )
        return items, total

    @classmethod
    def create_administrator(
        cls,
        db: Session,
        *,
        actor: User,
        first_name: str,
        last_name: str,
        email: str,
        temporary_password: str,
        is_active: bool,
    ) -> User:
        normalized_email = email.strip().lower()
        existing = db.scalar(
            select(User).where(User.email == normalized_email)
        )
        if existing is not None:
            if existing.is_admin:
                raise HTTPException(
                    status_code=409,
                    detail="An administrator already uses this email.",
                )
            raise HTTPException(
                status_code=409,
                detail=(
                    "A customer already uses this email. "
                    "Use Promote existing customer instead."
                ),
            )

        try:
            validate_password_policy(db, temporary_password)
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail=str(exc),
            ) from exc

        first = first_name.strip()
        last = last_name.strip()
        if not first or not last:
            raise HTTPException(
                status_code=422,
                detail="First and last name are required.",
            )

        user = User(
            email=normalized_email,
            phone=None,
            password_hash=hash_password(temporary_password),
            first_name=first,
            last_name=last,
            is_active=is_active,
            is_verified=True,
            is_admin=True,
        )
        db.add(user)
        db.flush()
        db.add(
            AuditLog(
                user_id=actor.id,
                action="administrator.created",
                entity_type="user",
                entity_id=user.id,
                details={
                    "email": user.email,
                    "active": is_active,
                    "account_created": False,
                },
            )
        )
        db.commit()
        db.refresh(user)
        return user

    @classmethod
    def promote_customer(
        cls,
        db: Session,
        *,
        actor: User,
        user_id: UUID,
    ) -> User:
        user = db.scalar(
            select(User)
            .where(User.id == user_id)
            .with_for_update()
        )
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="Customer not found.",
            )
        if user.account is None:
            raise HTTPException(
                status_code=409,
                detail="Only an account-backed customer can be promoted.",
            )
        if user.is_admin:
            raise HTTPException(
                status_code=409,
                detail="This customer is already an administrator.",
            )

        user.is_admin = True
        user.is_active = True
        db.add(
            AuditLog(
                user_id=actor.id,
                action="administrator.promoted",
                entity_type="user",
                entity_id=user.id,
                details={
                    "email": user.email,
                    "customer_account_preserved": True,
                },
            )
        )
        db.commit()
        db.refresh(user)
        return user

    @classmethod
    def set_administrator_active(
        cls,
        db: Session,
        *,
        actor: User,
        administrator_id: UUID,
        is_active: bool,
        reason: str | None,
    ) -> User:
        user = db.scalar(
            select(User)
            .where(
                User.id == administrator_id,
                User.is_admin.is_(True),
            )
            .with_for_update()
        )
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="Administrator not found.",
            )
        if user.id == actor.id and not is_active:
            raise HTTPException(
                status_code=409,
                detail="You cannot disable your own administrator account.",
            )

        user.is_active = is_active
        db.add(
            AuditLog(
                user_id=actor.id,
                action=(
                    "administrator.reactivated"
                    if is_active
                    else "administrator.disabled"
                ),
                entity_type="user",
                entity_id=user.id,
                details={"reason": reason},
            )
        )
        db.commit()
        db.refresh(user)
        return user

    @classmethod
    def sessions(
        cls,
        db: Session,
        *,
        q: str | None,
        user_type: str | None,
        status: str | None,
        start_date: date | None,
        end_date: date | None,
        limit: int,
        offset: int,
    ) -> tuple[list[tuple[UserSession, User]], int]:
        now = datetime.now(UTC)
        stmt = (
            select(UserSession, User)
            .join(User, User.id == UserSession.user_id)
        )
        count_stmt = (
            select(func.count())
            .select_from(UserSession)
            .join(User, User.id == UserSession.user_id)
        )

        if q:
            term = f"%{q.strip()}%"
            predicate = or_(
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                UserSession.ip_address.ilike(term),
                UserSession.user_agent.ilike(term),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)

        if user_type == "administrator":
            stmt = stmt.where(User.is_admin.is_(True))
            count_stmt = count_stmt.where(User.is_admin.is_(True))
        elif user_type == "customer":
            stmt = stmt.where(User.is_admin.is_(False))
            count_stmt = count_stmt.where(User.is_admin.is_(False))

        if status == "active":
            predicates = cls._active_session_predicate(now)
            stmt = stmt.where(*predicates)
            count_stmt = count_stmt.where(*predicates)
        elif status == "revoked":
            stmt = stmt.where(UserSession.revoked_at.is_not(None))
            count_stmt = count_stmt.where(
                UserSession.revoked_at.is_not(None)
            )
        elif status == "expired":
            stmt = stmt.where(
                UserSession.revoked_at.is_(None),
                UserSession.expires_at <= now,
            )
            count_stmt = count_stmt.where(
                UserSession.revoked_at.is_(None),
                UserSession.expires_at <= now,
            )

        if start_date:
            start = datetime.combine(
                start_date,
                datetime.min.time(),
                tzinfo=UTC,
            )
            stmt = stmt.where(UserSession.created_at >= start)
            count_stmt = count_stmt.where(
                UserSession.created_at >= start
            )

        if end_date:
            end = datetime.combine(
                end_date + timedelta(days=1),
                datetime.min.time(),
                tzinfo=UTC,
            )
            stmt = stmt.where(UserSession.created_at < end)
            count_stmt = count_stmt.where(
                UserSession.created_at < end
            )

        total = int(db.scalar(count_stmt) or 0)
        rows = db.execute(
            stmt.order_by(UserSession.created_at.desc())
            .limit(limit)
            .offset(offset)
        ).all()
        return list(rows), total

    @staticmethod
    def session_status(
        item: UserSession,
        now: datetime | None = None,
    ) -> str:
        now = now or datetime.now(UTC)
        if item.revoked_at is not None:
            return "revoked"
        if item.expires_at <= now:
            return "expired"
        return "active"

    @classmethod
    def revoke_session(
        cls,
        db: Session,
        *,
        actor: User,
        session_id: UUID,
        current_session_id: UUID | None,
    ) -> None:
        session = db.scalar(
            select(UserSession)
            .where(UserSession.id == session_id)
            .with_for_update()
        )
        if session is None:
            raise HTTPException(
                status_code=404,
                detail="Session not found.",
            )
        if current_session_id == session.id:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Use Sign out to end the administrator "
                    "session currently performing this action."
                ),
            )
        if session.revoked_at is not None:
            return

        session.revoked_at = datetime.now(UTC)
        db.add(
            AuditLog(
                user_id=actor.id,
                action="session.revoked_by_admin",
                entity_type="session",
                entity_id=session.id,
                details={
                    "target_user_id": str(session.user_id),
                },
            )
        )
        db.commit()

    @classmethod
    def revoke_user_sessions(
        cls,
        db: Session,
        *,
        actor: User,
        user_id: UUID,
        current_session_id: UUID | None,
    ) -> int:
        if user_id == actor.id and current_session_id is not None:
            predicate = UserSession.id != current_session_id
        else:
            predicate = UserSession.id.is_not(None)

        now = datetime.now(UTC)
        result = db.execute(
            update(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > now,
                predicate,
            )
            .values(revoked_at=now)
        )
        count = int(result.rowcount or 0)
        db.add(
            AuditLog(
                user_id=actor.id,
                action="sessions.revoked_by_admin",
                entity_type="user",
                entity_id=user_id,
                details={
                    "count": count,
                    "current_session_preserved": user_id == actor.id,
                },
            )
        )
        db.commit()
        return count

    @classmethod
    def audit_logs(
        cls,
        db: Session,
        *,
        q: str | None,
        action: str | None,
        entity_type: str | None,
        start_date: date | None,
        end_date: date | None,
        limit: int,
        offset: int,
    ) -> tuple[list[AuditLog], int]:
        stmt = (
            select(AuditLog)
            .options(joinedload(AuditLog.user))
        )
        count_stmt = select(func.count()).select_from(AuditLog)

        if q:
            term = f"%{q.strip()}%"
            stmt = stmt.outerjoin(User, User.id == AuditLog.user_id)
            count_stmt = count_stmt.outerjoin(
                User,
                User.id == AuditLog.user_id,
            )
            predicate = or_(
                AuditLog.action.ilike(term),
                AuditLog.entity_type.ilike(term),
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)

        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
            count_stmt = count_stmt.where(
                AuditLog.action.ilike(f"%{action}%")
            )

        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
            count_stmt = count_stmt.where(
                AuditLog.entity_type == entity_type
            )

        if start_date:
            start = datetime.combine(
                start_date,
                datetime.min.time(),
                tzinfo=UTC,
            )
            stmt = stmt.where(AuditLog.created_at >= start)
            count_stmt = count_stmt.where(
                AuditLog.created_at >= start
            )
        if end_date:
            end = datetime.combine(
                end_date + timedelta(days=1),
                datetime.min.time(),
                tzinfo=UTC,
            )
            stmt = stmt.where(AuditLog.created_at < end)
            count_stmt = count_stmt.where(
                AuditLog.created_at < end
            )

        total = int(db.scalar(count_stmt) or 0)
        items = list(
            db.scalars(
                stmt.order_by(AuditLog.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .unique()
            .all()
        )
        return items, total

    @classmethod
    def reconciliation_report(
        cls,
        db: Session,
    ) -> dict:
        raw = ReconciliationService.all_accounts(db)
        accounts_by_id = {
            account.id: account
            for account in db.scalars(
                select(Account)
                .options(joinedload(Account.user))
            ).all()
        }

        rows = []
        account_total = Decimal("0.00")
        ledger_total = Decimal("0.00")
        held_total = Decimal("0.00")
        expected_held_total = Decimal("0.00")

        for item in raw["results"]:
            account = accounts_by_id.get(item["account_id"])
            actual_available = Decimal(
                item["actual_available_balance"]
            )
            expected_available = Decimal(
                item["expected_available_balance"]
            )
            actual_held = Decimal(item["actual_held_balance"])
            expected_held = Decimal(
                item["expected_held_balance"]
            )
            available_difference = (
                actual_available - expected_available
            ).quantize(Decimal("0.01"))
            held_difference = (
                actual_held - expected_held
            ).quantize(Decimal("0.01"))

            severity = "healthy"
            if available_difference != 0 or held_difference != 0:
                magnitude = max(
                    abs(available_difference),
                    abs(held_difference),
                )
                severity = (
                    "warning"
                    if magnitude < Decimal("100.00")
                    else "critical"
                )

            rows.append(
                {
                    "account_id": item["account_id"],
                    "account_number": item["account_number"],
                    "customer_name": (
                        f"{account.user.first_name} "
                        f"{account.user.last_name}"
                    ).strip()
                    if account and account.user
                    else "Unknown",
                    "actual_available_balance": actual_available,
                    "expected_available_balance": expected_available,
                    "actual_held_balance": actual_held,
                    "expected_held_balance": expected_held,
                    "available_difference": available_difference,
                    "held_difference": held_difference,
                    "status": severity,
                }
            )
            account_total += actual_available
            ledger_total += expected_available
            held_total += actual_held
            expected_held_total += expected_held

        unmatched_transactions = int(
            db.scalar(
                select(func.count())
                .select_from(Transaction)
                .outerjoin(
                    LedgerEntry,
                    LedgerEntry.transaction_id == Transaction.id,
                )
                .where(LedgerEntry.id.is_(None))
            )
            or 0
        )

        mismatched = int(raw["mismatched"])
        status = (
            "healthy"
            if mismatched == 0 and unmatched_transactions == 0
            else "warning"
            if mismatched <= 2 and unmatched_transactions <= 2
            else "critical"
        )

        return {
            "summary": {
                "checked": int(raw["checked"]),
                "mismatched": mismatched,
                "account_balance_total": account_total.quantize(
                    Decimal("0.01")
                ),
                "ledger_balance_total": ledger_total.quantize(
                    Decimal("0.01")
                ),
                "held_balance_total": held_total.quantize(
                    Decimal("0.01")
                ),
                "expected_held_total": expected_held_total.quantize(
                    Decimal("0.01")
                ),
                "unmatched_transactions": unmatched_transactions,
                "status": status,
            },
            "accounts": rows,
        }

    @classmethod
    def run_reconciliation(
        cls,
        db: Session,
        *,
        actor: User,
    ) -> tuple[dict, datetime]:
        completed_at = datetime.now(UTC)
        report = cls.reconciliation_report(db)
        db.add(
            AuditLog(
                user_id=actor.id,
                action="reconciliation.run",
                entity_type="reconciliation",
                entity_id=None,
                details={
                    "checked": report["summary"]["checked"],
                    "mismatched": report["summary"]["mismatched"],
                    "unmatched_transactions": report["summary"][
                        "unmatched_transactions"
                    ],
                    "status": report["summary"]["status"],
                },
            )
        )
        db.commit()
        return report, completed_at
