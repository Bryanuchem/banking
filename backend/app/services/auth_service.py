from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.enums.otp_purpose import OtpPurpose
from app.models.user import User
from app.services.account_service import AccountService
from app.services.email_service import EmailService
from app.services.otp_service import OtpService
from app.services.session_service import SessionService
from app.services.setting_service import SettingService
from app.services.two_factor_service import TwoFactorService
from app.utils.security import hash_password, validate_password_policy, verify_password
from app.utils.tokens import create_login_challenge_token


class AuthService:
    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @classmethod
    def register(cls, db: Session, *, email: str, password: str, first_name: str, last_name: str, phone: str | None) -> User:
        if not SettingService.get_boolean(db, SettingKeys.REGISTRATION_ENABLED, True):
            raise HTTPException(status_code=403, detail="Registration is currently disabled.")
        email = cls._normalize_email(email)
        if db.scalar(select(User.id).where(User.email == email)) is not None:
            raise HTTPException(status_code=409, detail="An account with that email already exists.")
        try:
            validate_password_policy(db, password)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        verification_required = SettingService.get_boolean(db, SettingKeys.EMAIL_VERIFICATION_REQUIRED, False)
        user = User(
            email=email,
            phone=phone.strip() if phone else None,
            password_hash=hash_password(password),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            is_verified=not verification_required,
        )
        db.add(user)
        db.flush()
        AccountService.create_for_user(db, user)
        if verification_required:
            code = OtpService.create(db, user_id=user.id, purpose=OtpPurpose.EMAIL_VERIFICATION.value)
            EmailService.send(
                db,
                to_email=user.email,
                subject="Verify your email",
                text_body=f"Your verification code is {code}. It will expire soon.",
            )
        db.commit()
        db.refresh(user)
        return user

    @classmethod
    def authenticate_password(cls, db: Session, *, email: str, password: str) -> User:
        user = db.scalar(select(User).where(User.email == cls._normalize_email(email)))
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="This account is disabled.")
        if SettingService.get_boolean(db, SettingKeys.EMAIL_VERIFICATION_REQUIRED, False) and not user.is_verified:
            raise HTTPException(status_code=403, detail="Email verification is required.")
        return user

    @classmethod
    def begin_login(cls, db: Session, *, email: str, password: str) -> tuple[User, str | None]:
        user = cls.authenticate_password(db, email=email, password=password)
        config = TwoFactorService.get_config(db, user.id)
        if config and config.enabled:
            return user, create_login_challenge_token(user_id=user.id)
        return user, None

    @staticmethod
    def find_user_by_id(db: Session, user_id: UUID) -> User | None:
        return db.scalar(select(User).where(User.id == user_id))
