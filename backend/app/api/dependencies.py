from datetime import UTC, datetime
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

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
