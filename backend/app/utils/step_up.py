from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.two_factor_service import TwoFactorService
from app.utils.tokens import decode_token


def require_step_up_if_enabled(
    db: Session,
    *,
    user: User,
    authorization_token: str | None,
    required_scope: str,
) -> None:
    config = TwoFactorService.get_config(db, user.id)
    if config is None or not config.enabled:
        return

    if not authorization_token:
        raise HTTPException(
            status_code=403,
            detail="Fresh two-factor authorization is required for this action.",
        )

    payload = decode_token(authorization_token, "step_up")
    if payload is None:
        raise HTTPException(status_code=401, detail="Two-factor authorization is invalid or expired.")

    try:
        token_user_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Two-factor authorization is invalid.")

    if token_user_id != user.id or payload.get("scope") != required_scope:
        raise HTTPException(status_code=403, detail="Two-factor authorization does not permit this action.")
