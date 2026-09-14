from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.constants.setting_key import SettingKeys
from app.database.dependencies import get_db
from app.enums.otp_purpose import OtpPurpose
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.auth import (
    EmailOnlyRequest,
    LoginRequest,
    LoginResponse,
    ChangePasswordRequest,
    LoginTwoFactorRequest,
    RegisterRequest,
    ProfileUpdateRequest,
    ResetPasswordRequest,
    SecurityActivityItem,
    StepUpRequest,
    StepUpResponse,
    TwoFactorCodeRequest,
    TwoFactorConfirmResponse,
    TwoFactorSetupResponse,
    TwoFactorStatusResponse,
    UserSessionResponse,
    UserResponse,
    VerifyOtpRequest,
)
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.services.otp_service import OtpService
from app.services.notification_service import NotificationService
from app.services.rate_limit_service import RateLimitService
from app.services.session_service import SessionService
from app.services.two_factor_service import TwoFactorService
from app.utils.security import hash_password, validate_password_policy, verify_password
from app.utils.tokens import create_step_up_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _user_response(user: User) -> UserResponse:
    account = user.account
    if account is not None and account.deleted_at is not None:
        account = None

    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        account_number=account.account_number if account is not None else None,
        currency=account.currency if account is not None else None,
        created_at=user.created_at,
    )


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> UserResponse:
    RateLimitService.check(
        db, bucket="register", subject=_ip(request),
        setting_key=SettingKeys.RATE_LIMIT_REGISTER_PER_MINUTE,
        default_limit=5, window_seconds=60,
    )
    user = AuthService.register(db, **payload.model_dump())
    return _user_response(user)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> LoginResponse:
    normalized_email = str(payload.email).strip().lower()
    RateLimitService.check(
        db, bucket="login-ip", subject=_ip(request),
        setting_key=SettingKeys.RATE_LIMIT_LOGIN_PER_MINUTE,
        default_limit=5, window_seconds=60,
    )
    RateLimitService.check(
        db, bucket="login-account", subject=normalized_email,
        setting_key=SettingKeys.RATE_LIMIT_LOGIN_PER_MINUTE,
        default_limit=5, window_seconds=60,
    )
    user, challenge = AuthService.begin_login(db, email=normalized_email, password=payload.password)
    if challenge:
        db.commit()
        return LoginResponse(two_factor_required=True, challenge_token=challenge)

    AuthService.record_successful_login(user, ip_address=_ip(request))
    _, token = SessionService.create(
        db,
        user_id=user.id,
        remember_me=payload.remember_me,
        ip_address=_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return LoginResponse(two_factor_required=False, access_token=token, token_type="bearer")


@router.post("/login/2fa", response_model=LoginResponse)
def login_two_factor(payload: LoginTwoFactorRequest, request: Request, db: Session = Depends(get_db)) -> LoginResponse:
    RateLimitService.check(
        db, bucket="login-2fa", subject=_ip(request),
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    decoded = decode_token(payload.challenge_token, "login_2fa")
    if decoded is None:
        raise HTTPException(status_code=401, detail="Two-factor login challenge is invalid or expired.")
    try:
        user_id = UUID(str(decoded["sub"]))
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Two-factor login challenge is invalid.")
    user = AuthService.find_user_by_id(db, user_id)
    if user is None or not TwoFactorService.verify(db, user, payload.code):
        raise HTTPException(status_code=401, detail="Invalid two-factor authentication code.")
    AuthService.record_successful_login(user, ip_address=_ip(request))
    _, token = SessionService.create(
        db,
        user_id=user.id,
        remember_me=payload.remember_me,
        ip_address=_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return LoginResponse(two_factor_required=False, access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return _user_response(user)


@router.post("/logout")
def logout(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    auth = request.headers.get("authorization", "")
    token = auth.split(" ", 1)[1] if " " in auth else ""
    payload = decode_token(token, "access")
    if payload:
        try:
            session_id = UUID(str(payload["sid"]))
            session = SessionService.get_active(db, session_id)
            if session and session.user_id == user.id:
                SessionService.revoke(db, session)
        except (KeyError, ValueError):
            pass
    return {"message": "Logged out."}


@router.post("/email/send-verification")
def send_verification(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    RateLimitService.check(
        db, bucket="email-verification", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    if user.is_verified:
        return {"message": "Email is already verified."}
    code = OtpService.create(db, user_id=user.id, purpose=OtpPurpose.EMAIL_VERIFICATION.value)
    EmailService.send(db, to_email=user.email, subject="Verify your email", text_body=f"Your verification code is {code}.")
    db.commit()
    return {"message": "Verification code sent."}


@router.post("/email/verify")
def verify_email(payload: VerifyOtpRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    email = str(payload.email).strip().lower()
    RateLimitService.check(
        db, bucket="email-verify", subject=f"{_ip(request)}:{email}",
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid verification request.")
    OtpService.verify(db, user_id=user.id, purpose=OtpPurpose.EMAIL_VERIFICATION.value, code=payload.code)
    user.is_verified = True
    db.commit()
    return {"message": "Email verified."}


@router.post("/password/forgot")
def forgot_password(payload: EmailOnlyRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    email = str(payload.email).strip().lower()
    RateLimitService.check(
        db, bucket="forgot-ip", subject=_ip(request),
        setting_key=SettingKeys.RATE_LIMIT_FORGOT_PASSWORD_PER_15_MINUTES,
        default_limit=3, window_seconds=900,
    )
    RateLimitService.check(
        db, bucket="forgot-account", subject=email,
        setting_key=SettingKeys.RATE_LIMIT_FORGOT_PASSWORD_PER_15_MINUTES,
        default_limit=3, window_seconds=900,
    )
    user = db.scalar(select(User).where(User.email == email))
    if user is not None and user.is_active:
        code = OtpService.create(db, user_id=user.id, purpose=OtpPurpose.PASSWORD_RESET.value)
        try:
            EmailService.send(db, to_email=user.email, subject="Password reset code", text_body=f"Your password reset code is {code}.")
            db.commit()
        except HTTPException:
            db.rollback()
            raise
    return {"message": "If an account exists for that email, a recovery code has been sent."}


@router.post("/password/verify")
def verify_password_code(payload: VerifyOtpRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    email = str(payload.email).strip().lower()
    RateLimitService.check(
        db, bucket="password-verify", subject=f"{_ip(request)}:{email}",
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    OtpService.verify(db, user_id=user.id, purpose=OtpPurpose.PASSWORD_RESET.value, code=payload.code, consume=False)
    return {"message": "Recovery code is valid."}


@router.post("/password/reset")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    email = str(payload.email).strip().lower()
    RateLimitService.check(
        db, bucket="password-reset", subject=f"{_ip(request)}:{email}",
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    OtpService.verify(db, user_id=user.id, purpose=OtpPurpose.PASSWORD_RESET.value, code=payload.code)
    try:
        validate_password_policy(db, payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    user.password_hash = hash_password(payload.new_password)
    NotificationService.safe_notify_user(
        db, user_id=user.id, title="Password changed",
        message="Your password was changed successfully.",
        event_type="security.password_changed", category="security", severity="success",
        action_url="/security/activity",
    )
    user.failed_login_attempts = 0
    user.locked_until = None
    SessionService.revoke_all(db, user.id)
    db.commit()
    return {"message": "Password changed successfully. Existing sessions have been revoked."}


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TwoFactorSetupResponse:
    result = TwoFactorService.begin_setup(db, user)
    db.commit()
    return TwoFactorSetupResponse(**result)


@router.post("/2fa/confirm", response_model=TwoFactorConfirmResponse)
def confirm_two_factor(payload: TwoFactorCodeRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TwoFactorConfirmResponse:
    RateLimitService.check(
        db, bucket="2fa-confirm", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    recovery_codes = TwoFactorService.confirm_setup(db, user, payload.code)
    NotificationService.safe_notify_user(
        db, user_id=user.id, title="Two-factor authentication enabled",
        message="Two-factor authentication is now protecting your account.",
        event_type="security.2fa_enabled", category="security", severity="success",
        action_url="/security/2fa",
    )
    _audit_security(
        db,
        user=user,
        action="2fa.enabled",
        request=request,
    )
    db.commit()
    return TwoFactorConfirmResponse(recovery_codes=recovery_codes)


@router.post("/2fa/disable")
def disable_two_factor(payload: TwoFactorCodeRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    RateLimitService.check(
        db, bucket="2fa-disable", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    TwoFactorService.disable(db, user, payload.code)
    NotificationService.safe_notify_user(
        db, user_id=user.id, title="Two-factor authentication disabled",
        message="Two-factor authentication was disabled on your account.",
        event_type="security.2fa_disabled", category="security", severity="warning",
        action_url="/security/2fa",
    )
    _audit_security(
        db,
        user=user,
        action="2fa.disabled",
        request=request,
    )
    db.commit()
    return {"message": "Two-factor authentication disabled."}


@router.post("/2fa/authorize", response_model=StepUpResponse)
def authorize_sensitive_action(payload: StepUpRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> StepUpResponse:
    RateLimitService.check(
        db, bucket="2fa-authorize", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES,
        default_limit=5, window_seconds=600,
    )
    config = TwoFactorService.get_config(db, user.id)
    if config and config.enabled:
        if not TwoFactorService.verify(db, user, payload.code):
            raise HTTPException(status_code=401, detail="Invalid two-factor authentication code.")
        db.commit()
    token = create_step_up_token(user_id=user.id, scope=payload.scope)
    return StepUpResponse(authorization_token=token, scope=payload.scope)


def _session_id_from_request(request: Request) -> UUID | None:
    auth = request.headers.get("authorization", "")
    token = auth.split(" ", 1)[1] if " " in auth else ""
    payload = decode_token(token, "access")
    if not payload:
        return None
    try:
        return UUID(str(payload["sid"]))
    except (KeyError, ValueError):
        return None


def _audit_security(
    db: Session,
    *,
    user: User,
    action: str,
    request: Request,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            entity_type="security",
            entity_id=user.id,
            ip_address=_ip(request),
            user_agent=request.headers.get("user-agent"),
            details=details,
        )
    )


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    phone = payload.phone.strip() if payload.phone else None
    if phone:
        existing = db.scalar(
            select(User).where(
                User.phone == phone,
                User.id != user.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="That phone number is already in use.",
            )

    user.first_name = payload.first_name.strip()
    user.last_name = payload.last_name.strip()
    user.phone = phone
    _audit_security(
        db,
        user=user,
        action="profile.updated",
        request=request,
    )
    db.commit()
    db.refresh(user)
    return _user_response(user)


@router.post("/password/change")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if not verify_password(
        payload.current_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    try:
        validate_password_policy(db, payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    if verify_password(
        payload.new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from your current password.",
        )

    user.password_hash = hash_password(payload.new_password)

    current_session_id = _session_id_from_request(request)
    if current_session_id is not None:
        SessionService.revoke_others(
            db,
            user_id=user.id,
            current_session_id=current_session_id,
        )

    _audit_security(
        db,
        user=user,
        action="password.changed",
        request=request,
    )
    db.commit()
    return {
        "message": "Password changed. Other sessions have been signed out."
    }


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
def two_factor_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TwoFactorStatusResponse:
    config = TwoFactorService.get_config(db, user.id)
    enabled = bool(config and config.enabled)
    remaining = (
        TwoFactorService.recovery_code_count(db, user.id)
        if enabled
        else 0
    )
    return TwoFactorStatusResponse(
        enabled=enabled,
        recovery_codes_remaining=remaining,
    )


@router.post(
    "/2fa/recovery-codes",
    response_model=TwoFactorConfirmResponse,
)
def regenerate_recovery_codes(
    payload: TwoFactorCodeRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TwoFactorConfirmResponse:
    codes = TwoFactorService.regenerate_recovery_codes(
        db,
        user,
        payload.code,
    )
    _audit_security(
        db,
        user=user,
        action="2fa.recovery_codes_regenerated",
        request=request,
    )
    db.commit()
    return TwoFactorConfirmResponse(recovery_codes=codes)


@router.get(
    "/sessions",
    response_model=list[UserSessionResponse],
)
def list_sessions(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserSessionResponse]:
    current_id = _session_id_from_request(request)
    return [
        UserSessionResponse(
            id=item.id,
            current=item.id == current_id,
            user_agent=item.user_agent,
            ip_address=item.ip_address,
            last_seen_at=(
                item.last_seen_at.isoformat()
                if item.last_seen_at
                else None
            ),
            created_at=item.created_at.isoformat(),
            expires_at=item.expires_at.isoformat(),
        )
        for item in SessionService.list_active(db, user.id)
    ]


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    current_id = _session_id_from_request(request)
    if current_id == session_id:
        raise HTTPException(
            status_code=409,
            detail="Use Sign out to end your current session.",
        )

    changed = SessionService.revoke_by_id(
        db,
        user_id=user.id,
        session_id=session_id,
    )
    if not changed:
        raise HTTPException(
            status_code=404,
            detail="Session not found.",
        )

    _audit_security(
        db,
        user=user,
        action="session.revoked",
        request=request,
        details={"session_id": str(session_id)},
    )
    db.commit()
    return {"message": "Session signed out."}


@router.delete("/sessions")
def revoke_other_sessions(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    current_id = _session_id_from_request(request)
    if current_id is None:
        raise HTTPException(
            status_code=401,
            detail="Current session could not be identified.",
        )

    count = SessionService.revoke_others(
        db,
        user_id=user.id,
        current_session_id=current_id,
    )
    _audit_security(
        db,
        user=user,
        action="sessions.revoked_others",
        request=request,
        details={"count": count},
    )
    db.commit()
    return {
        "message": "Other sessions signed out.",
        "count": count,
    }


@router.get(
    "/security/activity",
    response_model=list[SecurityActivityItem],
)
def security_activity(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SecurityActivityItem]:
    audit_rows = db.scalars(
        select(AuditLog)
        .where(
            AuditLog.user_id == user.id,
            AuditLog.entity_type == "security",
        )
        .order_by(AuditLog.created_at.desc())
        .limit(30)
    ).all()

    labels = {
        "profile.updated": "Profile updated",
        "password.changed": "Password changed",
        "2fa.recovery_codes_regenerated": "Recovery codes regenerated",
        "session.revoked": "Session signed out",
        "sessions.revoked_others": "Other sessions signed out",
    }

    items = [
        SecurityActivityItem(
            id=str(row.id),
            event=labels.get(row.action, row.action),
            details=None,
            created_at=row.created_at.isoformat(),
        )
        for row in audit_rows
    ]

    for session in SessionService.list_active(db, user.id)[:10]:
        items.append(
            SecurityActivityItem(
                id=f"session-{session.id}",
                event="Active sign-in",
                details=session.user_agent,
                created_at=(
                    session.last_seen_at
                    or session.created_at
                ).isoformat(),
            )
        )

    return sorted(
        items,
        key=lambda item: item.created_at,
        reverse=True,
    )[:30]
