from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.models.user_session import UserSession
from app.services.setting_service import SettingService
from app.utils.tokens import create_access_token


class SessionService:
    @classmethod
    def create(
        cls,
        db: Session,
        *,
        user_id: UUID,
        remember_me: bool,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[UserSession, str]:
        now = datetime.now(UTC)
        if remember_me:
            expires_at = now + timedelta(days=SettingService.get_integer(db, SettingKeys.REMEMBER_ME_EXPIRE_DAYS, 30))
        else:
            expires_at = now + timedelta(minutes=SettingService.get_integer(db, SettingKeys.JWT_EXPIRE_MINUTES, 30))
        session = UserSession(
            user_id=user_id,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            last_seen_at=now,
        )
        db.add(session)
        db.flush()
        token = create_access_token(user_id=user_id, session_id=session.id, expires_at=expires_at)
        return session, token

    @staticmethod
    def get_active(db: Session, session_id: UUID) -> UserSession | None:
        session = db.scalar(select(UserSession).where(UserSession.id == session_id))
        if session is None or session.revoked_at is not None:
            return None
        if session.expires_at <= datetime.now(UTC):
            return None
        return session

    @staticmethod
    def revoke(db: Session, session: UserSession) -> None:
        session.revoked_at = datetime.now(UTC)
        db.commit()
