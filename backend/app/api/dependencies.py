from datetime import UTC, datetime
from secrets import compare_digest
from uuid import UUID

from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.database.dependencies import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.session_service import SessionService
from app.utils.tokens import decode_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    payload = decode_token(credentials.credentials, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")
    try:
        user_id = UUID(str(payload["sub"]))
        session_id = UUID(str(payload["sid"]))
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid access token.")
    session = SessionService.get_active(db, session_id)
    if session is None or session.user_id != user_id:
        raise HTTPException(status_code=401, detail="Session is no longer active.")
    session.last_seen_at = datetime.now(UTC)
    user = AuthService.find_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is no longer available.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    return user


def require_internal_service(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    expected = settings.internal_service_token
    if not expected:
        raise HTTPException(status_code=503, detail="Internal service authentication is not configured.")
    if not x_internal_service_token or not compare_digest(x_internal_service_token, expected):
        raise HTTPException(status_code=401, detail="Invalid internal service credentials.")
