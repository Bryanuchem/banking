from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=32)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class LoginTwoFactorRequest(BaseModel):
    challenge_token: str
    code: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    two_factor_required: bool
    challenge_token: str | None = None
    access_token: str | None = None
    token_type: str | None = None


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: str | None
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    account_number: str
    currency: str


class EmailOnlyRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class TwoFactorCodeRequest(BaseModel):
    code: str


class TwoFactorSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str


class TwoFactorConfirmResponse(BaseModel):
    enabled: bool = True
    recovery_codes: list[str]


class StepUpRequest(BaseModel):
    code: str
    scope: str = "payment"


class StepUpResponse(BaseModel):
    authorization_token: str
    scope: str
