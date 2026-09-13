from enum import StrEnum


class OtpPurpose(StrEnum):
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    LOGIN_VERIFICATION = "login_verification"
    PAYMENT_VERIFICATION = "payment_verification"
