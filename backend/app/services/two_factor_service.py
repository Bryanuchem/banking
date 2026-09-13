import secrets
from datetime import UTC, datetime
from uuid import UUID

import pyotp
from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.models.two_factor_recovery_code import TwoFactorRecoveryCode
from app.models.two_factor_settings import TwoFactorSettings
from app.models.user import User
from app.services.setting_secret_service import SettingSecretService
from app.services.setting_service import SettingService
from app.utils.security import hash_password, verify_password


class TwoFactorService:
    @staticmethod
    def get_config(db: Session, user_id: UUID) -> TwoFactorSettings | None:
        return db.scalar(select(TwoFactorSettings).where(TwoFactorSettings.user_id == user_id))

    @classmethod
    def begin_setup(cls, db: Session, user: User) -> dict[str, str]:
        existing = cls.get_config(db, user.id)
        if existing and existing.enabled:
            raise HTTPException(status_code=409, detail="Two-factor authentication is already enabled.")
        secret = pyotp.random_base32()
        if existing is None:
            existing = TwoFactorSettings(user_id=user.id, secret_encrypted=SettingSecretService.encrypt(secret), enabled=False)
            db.add(existing)
        else:
            existing.secret_encrypted = SettingSecretService.encrypt(secret)
            existing.enabled = False
            existing.enabled_at = None
        db.flush()
        issuer = SettingService.get_string(db, SettingKeys.TWO_FACTOR_ISSUER, "Banking")
        uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)
        return {"secret": secret, "provisioning_uri": uri}

    @classmethod
    def confirm_setup(cls, db: Session, user: User, code: str) -> list[str]:
        config = cls.get_config(db, user.id)
        if config is None:
            raise HTTPException(status_code=400, detail="Two-factor setup has not been started.")
        secret = SettingSecretService.decrypt(config.secret_encrypted)
        if not pyotp.TOTP(secret).verify(code, valid_window=1):
            raise HTTPException(status_code=400, detail="Invalid two-factor authentication code.")
        config.enabled = True
        config.enabled_at = datetime.now(UTC)
        db.execute(delete(TwoFactorRecoveryCode).where(TwoFactorRecoveryCode.user_id == user.id))
        count = max(5, min(20, SettingService.get_integer(db, SettingKeys.TWO_FACTOR_RECOVERY_CODE_COUNT, 10)))
        codes = [secrets.token_hex(5).upper() for _ in range(count)]
        for code_value in codes:
            db.add(TwoFactorRecoveryCode(user_id=user.id, code_hash=hash_password(code_value)))
        db.flush()
        return codes

    @classmethod
    def verify(cls, db: Session, user: User, code: str) -> bool:
        config = cls.get_config(db, user.id)
        if config is None or not config.enabled:
            return False
        secret = SettingSecretService.decrypt(config.secret_encrypted)
        if pyotp.TOTP(secret).verify(code, valid_window=1):
            return True
        recovery_codes = db.scalars(
            select(TwoFactorRecoveryCode).where(
                TwoFactorRecoveryCode.user_id == user.id,
                TwoFactorRecoveryCode.used_at.is_(None),
            )
        ).all()
        for recovery in recovery_codes:
            if verify_password(code, recovery.code_hash):
                recovery.used_at = datetime.now(UTC)
                return True
        return False


@classmethod
def recovery_code_count(cls, db: Session, user_id: UUID) -> int:
    return len(
        db.scalars(
            select(TwoFactorRecoveryCode).where(
                TwoFactorRecoveryCode.user_id == user_id,
                TwoFactorRecoveryCode.used_at.is_(None),
            )
        ).all()
    )

@classmethod
def regenerate_recovery_codes(
    cls,
    db: Session,
    user: User,
    code: str,
) -> list[str]:
    if not cls.verify(db, user, code):
        raise HTTPException(
            status_code=400,
            detail="Invalid two-factor authentication code.",
        )

    config = cls.get_config(db, user.id)
    if config is None or not config.enabled:
        raise HTTPException(
            status_code=409,
            detail="Two-factor authentication is not enabled.",
        )

    db.execute(
        delete(TwoFactorRecoveryCode).where(
            TwoFactorRecoveryCode.user_id == user.id
        )
    )
    count = max(
        5,
        min(
            20,
            SettingService.get_integer(
                db,
                SettingKeys.TWO_FACTOR_RECOVERY_CODE_COUNT,
                10,
            ),
        ),
    )
    codes = [secrets.token_hex(5).upper() for _ in range(count)]
    for value in codes:
        db.add(
            TwoFactorRecoveryCode(
                user_id=user.id,
                code_hash=hash_password(value),
            )
        )
    db.flush()
    return codes

    @classmethod
    def disable(cls, db: Session, user: User, code: str) -> None:
        if not cls.verify(db, user, code):
            raise HTTPException(status_code=400, detail="Invalid two-factor authentication code.")
        config = cls.get_config(db, user.id)
        assert config is not None
        config.enabled = False
        config.enabled_at = None
        db.execute(delete(TwoFactorRecoveryCode).where(TwoFactorRecoveryCode.user_id == user.id))
        db.commit()
