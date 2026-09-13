class SettingKeys:
    # Branding
    BRAND_NAME = "brand_name"
    BRAND_SHORT_NAME = "brand_short_name"
    LOGO_URL = "logo_url"
    FAVICON_URL = "favicon_url"
    PRIMARY_CURRENCY = "primary_currency"
    SUPPORT_EMAIL = "support_email"
    SUPPORT_PHONE = "support_phone"

    # Authentication
    REGISTRATION_ENABLED = "registration_enabled"
    EMAIL_VERIFICATION_REQUIRED = "email_verification_required"
    JWT_EXPIRE_MINUTES = "jwt_expire_minutes"
    REMEMBER_ME_EXPIRE_DAYS = "remember_me_expire_days"
    MAX_LOGIN_ATTEMPTS = "max_login_attempts"
    PASSWORD_MIN_LENGTH = "password_min_length"
    REQUIRE_SPECIAL_CHARACTERS = "require_special_characters"
    REQUIRE_UPPERCASE = "require_uppercase"
    REQUIRE_NUMBERS = "require_numbers"

    # Two factor
    TWO_FACTOR_AUTH_POLICY = "two_factor_auth_policy"
    TWO_FACTOR_ISSUER = "two_factor_issuer"
    TWO_FACTOR_RECOVERY_CODE_COUNT = "two_factor_recovery_code_count"

    # OTP
    OTP_EXPIRY_MINUTES = "otp_expiry_minutes"
    OTP_LENGTH = "otp_length"

    # SMTP
    SMTP_ENABLED = "smtp_enabled"
    SMTP_HOST = "smtp_host"
    SMTP_PORT = "smtp_port"
    SMTP_USERNAME = "smtp_username"
    SMTP_PASSWORD = "smtp_password"
    SMTP_FROM_EMAIL = "smtp_from_email"
    SMTP_USE_TLS = "smtp_use_tls"
