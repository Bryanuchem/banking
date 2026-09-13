from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.dependencies import get_db
from app.enums.otp_purpose import OtpPurpose
from app.models.user import User
from app.schemas.auth import (
    EmailOnlyRequest,
    LoginRequest,
    LoginResponse,
    LoginTwoFactorRequest,
    RegisterRequest,
    ResetPasswordRequest,
    StepUpRequest,
    StepUpResponse,
    TwoFactorCodeRequest,
    TwoFactorConfirmResponse,
    TwoFactorSetupResponse,
    UserResponse,
    VerifyOtpRequest,
)
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.services.otp_service import OtpService
from app.services.session_service import SessionService
from app.services.two_factor_service import TwoFactorService
from app.utils.security import hash_password, validate_password_policy
from app.utils.tokens import create_step_up_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        account_number=user.account.account_number,
        currency=user.account.currency,
    )


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserResponse:
    user = AuthService.register(db, **payload.model_dump())
    return _user_response(user)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> LoginResponse:
    user, challenge = AuthService.begin_login(db, email=str(payload.email), password=payload.password)
    if challenge:
        return LoginResponse(two_factor_required=True, challenge_token=challenge)
    _, token = SessionService.create(
        db,
        user_id=user.id,
        remember_me=payload.remember_me,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return LoginResponse(two_factor_required=False, access_token=token, token_type="bearer")


@router.post("/login/2fa", response_model=LoginResponse)
def login_two_factor(payload: LoginTwoFactorRequest, request: Request, db: Session = Depends(get_db)) -> LoginResponse:
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
    _, token = SessionService.create(
        db,
        user_id=user.id,
        remember_me=payload.remember_me,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    return LoginResponse(two_factor_required=False, access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return _user_response(user)


@router.post("/logout")
def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
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
def send_verification(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    if user.is_verified:
        return {"message": "Email is already verified."}
    code = OtpService.create(db, user_id=user.id, purpose=OtpPurpose.EMAIL_VERIFICATION.value)
    EmailService.send(db, to_email=user.email, subject="Verify your email", text_body=f"Your verification code is {code}.")
    db.commit()
    return {"message": "Verification code sent."}


@router.post("/email/verify")
def verify_email(payload: VerifyOtpRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.scalar(select(User).where(User.email == str(payload.email).strip().lower()))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid verification request.")
    OtpService.verify(db, user_id=user.id, purpose=OtpPurpose.EMAIL_VERIFICATION.value, code=payload.code)
    user.is_verified = True
    db.commit()
    return {"message": "Email verified."}


@router.post("/password/forgot")
def forgot_password(payload: EmailOnlyRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.scalar(select(User).where(User.email == str(payload.email).strip().lower()))
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
def verify_password_code(payload: VerifyOtpRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.scalar(select(User).where(User.email == str(payload.email).strip().lower()))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    OtpService.verify(db, user_id=user.id, purpose=OtpPurpose.PASSWORD_RESET.value, code=payload.code, consume=False)
    return {"message": "Recovery code is valid."}


@router.post("/password/reset")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.scalar(select(User).where(User.email == str(payload.email).strip().lower()))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    OtpService.verify(db, user_id=user.id, purpose=OtpPurpose.PASSWORD_RESET.value, code=payload.code)
    try:
        validate_password_policy(db, payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TwoFactorSetupResponse:
    result = TwoFactorService.begin_setup(db, user)
    db.commit()
    return TwoFactorSetupResponse(**result)


@router.post("/2fa/confirm", response_model=TwoFactorConfirmResponse)
def confirm_two_factor(
    payload: TwoFactorCodeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TwoFactorConfirmResponse:
    recovery_codes = TwoFactorService.confirm_setup(db, user, payload.code)
    db.commit()
    return TwoFactorConfirmResponse(recovery_codes=recovery_codes)


@router.post("/2fa/disable")
def disable_two_factor(
    payload: TwoFactorCodeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    TwoFactorService.disable(db, user, payload.code)
    return {"message": "Two-factor authentication disabled."}


@router.post("/2fa/authorize", response_model=StepUpResponse)
def authorize_sensitive_action(
    payload: StepUpRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StepUpResponse:
    config = TwoFactorService.get_config(db, user.id)
    if config and config.enabled:
        if not TwoFactorService.verify(db, user, payload.code):
            raise HTTPException(status_code=401, detail="Invalid two-factor authentication code.")
        db.commit()
    token = create_step_up_token(user_id=user.id, scope=payload.scope)
    return StepUpResponse(authorization_token=token, scope=payload.scope)
