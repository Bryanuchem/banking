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
    LOGIN_LOCKOUT_MINUTES = "login_lockout_minutes"
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

    # Withdrawals
    WITHDRAWAL_FEE_ENABLED = "withdrawal_fee_enabled"
    WITHDRAWAL_FEE_FLAT = "withdrawal_fee_flat"
    WITHDRAWAL_FEE_PERCENT = "withdrawal_fee_percent"

    # Payments
    PAYMENT_PROVIDER = "payment_provider"
    PAYSTACK_SECRET_KEY = "paystack_secret_key"
    PAYSTACK_CALLBACK_URL = "paystack_callback_url"
    STRIPE_SECRET_KEY = "stripe_secret_key"
    STRIPE_WEBHOOK_SECRET = "stripe_webhook_secret"
    STRIPE_SUCCESS_URL = "stripe_success_url"
    STRIPE_CANCEL_URL = "stripe_cancel_url"
    STRIPE_CALLBACK_URL = "stripe_callback_url"
    PAYPAL_ENVIRONMENT = "paypal_environment"
    PAYPAL_CLIENT_ID = "paypal_client_id"
    PAYPAL_CLIENT_SECRET = "paypal_client_secret"
    PAYPAL_WEBHOOK_ID = "paypal_webhook_id"
    PAYPAL_RETURN_URL = "paypal_return_url"
    PAYPAL_CANCEL_URL = "paypal_cancel_url"
    CASHAPP_ENVIRONMENT = "cashapp_environment"
    CASHAPP_CLIENT_ID = "cashapp_client_id"
    CASHAPP_API_KEY_ID = "cashapp_api_key_id"
    CASHAPP_API_SECRET = "cashapp_api_secret"
    CASHAPP_MERCHANT_ID = "cashapp_merchant_id"
    CASHAPP_REGION = "cashapp_region"
    CASHAPP_REDIRECT_URL = "cashapp_redirect_url"

    # Rate limiting
    RATE_LIMIT_ENABLED = "rate_limit_enabled"
    RATE_LIMIT_REGISTER_PER_MINUTE = "rate_limit_register_per_minute"
    RATE_LIMIT_LOGIN_PER_MINUTE = "rate_limit_login_per_minute"
    RATE_LIMIT_FORGOT_PASSWORD_PER_15_MINUTES = "rate_limit_forgot_password_per_15_minutes"
    RATE_LIMIT_OTP_PER_10_MINUTES = "rate_limit_otp_per_10_minutes"
    RATE_LIMIT_ACCOUNT_LOOKUP_PER_MINUTE = "rate_limit_account_lookup_per_minute"
    RATE_LIMIT_TRANSFER_PER_MINUTE = "rate_limit_transfer_per_minute"
    RATE_LIMIT_WITHDRAWAL_PER_HOUR = "rate_limit_withdrawal_per_hour"
    RATE_LIMIT_PAYMENT_PER_HOUR = "rate_limit_payment_per_hour"
    RATE_LIMIT_ADMIN_PER_MINUTE = "rate_limit_admin_per_minute"
