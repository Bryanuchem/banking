from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
from jwt import InvalidTokenError

from app.core.settings import settings

ISSUER = "banking"
ALGORITHM = "HS256"


def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, settings.app_secret_key, algorithm=ALGORITHM)


def _decode(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, settings.app_secret_key, algorithms=[ALGORITHM], issuer=ISSUER)
        return dict(payload)
    except InvalidTokenError:
        return None


def create_access_token(*, user_id: UUID, session_id: UUID, expires_at: datetime) -> str:
    now = datetime.now(UTC)
    return _encode({
        "sub": str(user_id),
        "sid": str(session_id),
        "type": "access",
        "iss": ISSUER,
        "iat": now,
        "exp": expires_at,
    })


def create_login_challenge_token(*, user_id: UUID, minutes: int = 5) -> str:
    now = datetime.now(UTC)
    return _encode({
        "sub": str(user_id),
        "type": "login_2fa",
        "iss": ISSUER,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    })


def create_step_up_token(*, user_id: UUID, scope: str, minutes: int = 5) -> str:
    now = datetime.now(UTC)
    return _encode({
        "sub": str(user_id),
        "type": "step_up",
        "scope": scope,
        "iss": ISSUER,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    })


def decode_token(token: str, expected_type: str) -> dict[str, Any] | None:
    payload = _decode(token)
    if payload is None or payload.get("type") != expected_type:
        return None
    return payload
