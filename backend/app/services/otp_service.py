import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.models.otp_code import OtpCode
from app.services.setting_service import SettingService
from app.utils.security import hash_password, verify_password


class OtpService:
    @staticmethod
    def _generate(length: int) -> str:
        return "".join(str(secrets.randbelow(10)) for _ in range(length))

    @classmethod
    def create(cls, db: Session, *, user_id: UUID, purpose: str) -> str:
        now = datetime.now(UTC)
        active_codes = db.scalars(
            select(OtpCode).where(
                OtpCode.user_id == user_id,
                OtpCode.purpose == purpose,
                OtpCode.used_at.is_(None),
            )
        ).all()
        for item in active_codes:
            item.used_at = now

        length = SettingService.get_integer(db, SettingKeys.OTP_LENGTH, 6)
        length = max(4, min(length, 8))
        expires = SettingService.get_integer(db, SettingKeys.OTP_EXPIRY_MINUTES, 10)
        code = cls._generate(length)
        db.add(
            OtpCode(
                user_id=user_id,
                purpose=purpose,
                code_hash=hash_password(code),
                expires_at=now + timedelta(minutes=max(1, expires)),
            )
        )
        db.flush()
        return code

    @staticmethod
    def verify(db: Session, *, user_id: UUID, purpose: str, code: str, consume: bool = True) -> OtpCode:
        item = db.scalar(
            select(OtpCode)
            .where(
                OtpCode.user_id == user_id,
                OtpCode.purpose == purpose,
                OtpCode.used_at.is_(None),
            )
            .order_by(OtpCode.created_at.desc())
        )
        if item is None or item.expires_at <= datetime.now(UTC) or not verify_password(code, item.code_hash):
            raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
        if consume:
            item.used_at = datetime.now(UTC)
        return item
