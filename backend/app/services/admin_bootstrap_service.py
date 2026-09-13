from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.account_service import AccountService
from app.utils.security import hash_password, validate_password_policy


@dataclass(frozen=True)
class AdminBootstrapResult:
    user: User
    created: bool
    promoted: bool


class AdminBootstrapService:
    @staticmethod
    def _normalize_email(value: str) -> str:
        return value.strip().lower()

    @staticmethod
    def _clean_name(value: str, field_name: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError(f"{field_name} is required.")
        if len(cleaned) > 100:
            raise ValueError(f"{field_name} must be 100 characters or fewer.")
        return cleaned

    @classmethod
    def create(
        cls,
        db: Session,
        *,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
    ) -> AdminBootstrapResult:
        normalized_email = cls._normalize_email(email)
        if not normalized_email:
            raise ValueError("Email is required.")

        existing = db.scalar(
            select(User).where(User.email == normalized_email)
        )
        if existing is not None:
            if existing.is_admin:
                return AdminBootstrapResult(
                    user=existing,
                    created=False,
                    promoted=False,
                )
            raise ValueError(
                "A customer already uses this email. "
                "Use promote_existing() explicitly if that is intentional."
            )

        validate_password_policy(db, password)

        user = User(
            email=normalized_email,
            phone=None,
            password_hash=hash_password(password),
            first_name=cls._clean_name(first_name, "First name"),
            last_name=cls._clean_name(last_name, "Last name"),
            is_active=True,
            is_verified=True,
            is_admin=True,
        )
        db.add(user)
        db.flush()

        # Banking currently uses one User identity model for customers and admins.
        # Keep the User invariant intact by creating the associated zero-balance
        # virtual account. Admin authorization is still controlled exclusively by
        # User.is_admin and require_admin().
        AccountService.create_for_user(db, user)

        db.commit()
        db.refresh(user)

        return AdminBootstrapResult(
            user=user,
            created=True,
            promoted=False,
        )

    @classmethod
    def promote_existing(
        cls,
        db: Session,
        *,
        email: str,
    ) -> AdminBootstrapResult:
        normalized_email = cls._normalize_email(email)
        user = db.scalar(
            select(User).where(User.email == normalized_email)
        )
        if user is None:
            raise ValueError("No user exists with that email address.")

        if user.is_admin:
            return AdminBootstrapResult(
                user=user,
                created=False,
                promoted=False,
            )

        user.is_admin = True
        user.is_active = True
        db.commit()
        db.refresh(user)

        return AdminBootstrapResult(
            user=user,
            created=False,
            promoted=True,
        )
