class SettingKeys:
    # Branding
    BRAND_NAME = "brand_name"
    BRAND_SHORT_NAME = "brand_short_name"
    LOGO_URL = "logo_url"
    FAVICON_URL = "favicon_url"
    PRIMARY_CURRENCY = "primary_currency"
    SUPPORT_EMAIL = "support_email"
    SUPPORT_PHONE = "support_phone"
    BRAND_TAGLINE = "brand_tagline"

    # Public landing page
    LANDING_EYEBROW = "landing_eyebrow"
    LANDING_TITLE = "landing_title"
    LANDING_DESCRIPTION = "landing_description"
    LANDING_PRIMARY_CTA_LABEL = "landing_primary_cta_label"
    LANDING_SECONDARY_CTA_LABEL = "landing_secondary_cta_label"
    LANDING_FEATURE_1_TITLE = "landing_feature_1_title"
    LANDING_FEATURE_1_DESCRIPTION = "landing_feature_1_description"
    LANDING_FEATURE_2_TITLE = "landing_feature_2_title"
    LANDING_FEATURE_2_DESCRIPTION = "landing_feature_2_description"
    LANDING_FEATURE_3_TITLE = "landing_feature_3_title"
    LANDING_FEATURE_3_DESCRIPTION = "landing_feature_3_description"

    # Support
    SUPPORT_WHATSAPP_URL = "support_whatsapp_url"
    SUPPORT_TELEGRAM_URL = "support_telegram_url"
    SUPPORT_HOURS = "support_hours"

    # Social
    SOCIAL_FACEBOOK_URL = "social_facebook_url"
    SOCIAL_INSTAGRAM_URL = "social_instagram_url"
    SOCIAL_X_URL = "social_x_url"
    SOCIAL_LINKEDIN_URL = "social_linkedin_url"
    SOCIAL_YOUTUBE_URL = "social_youtube_url"
    SOCIAL_TIKTOK_URL = "social_tiktok_url"
    SOCIAL_DISCORD_URL = "social_discord_url"

    # Branding - light theme
    BRAND_LIGHT_PRIMARY_COLOR = "brand_light_primary_color"
    BRAND_LIGHT_SECONDARY_COLOR = "brand_light_secondary_color"
    BRAND_LIGHT_ACCENT_COLOR = "brand_light_accent_color"
    BRAND_LIGHT_BACKGROUND_COLOR = "brand_light_background_color"
    BRAND_LIGHT_SURFACE_COLOR = "brand_light_surface_color"
    BRAND_LIGHT_SURFACE_ALT_COLOR = "brand_light_surface_alt_color"
    BRAND_LIGHT_TEXT_COLOR = "brand_light_text_color"
    BRAND_LIGHT_MUTED_COLOR = "brand_light_muted_color"
    BRAND_LIGHT_BORDER_COLOR = "brand_light_border_color"
    BRAND_LIGHT_SUCCESS_COLOR = "brand_light_success_color"
    BRAND_LIGHT_WARNING_COLOR = "brand_light_warning_color"
    BRAND_LIGHT_DANGER_COLOR = "brand_light_danger_color"

    # Branding - dark theme
    BRAND_DARK_PRIMARY_COLOR = "brand_dark_primary_color"
    BRAND_DARK_SECONDARY_COLOR = "brand_dark_secondary_color"
    BRAND_DARK_ACCENT_COLOR = "brand_dark_accent_color"
    BRAND_DARK_BACKGROUND_COLOR = "brand_dark_background_color"
    BRAND_DARK_SURFACE_COLOR = "brand_dark_surface_color"
    BRAND_DARK_SURFACE_ALT_COLOR = "brand_dark_surface_alt_color"
    BRAND_DARK_TEXT_COLOR = "brand_dark_text_color"
    BRAND_DARK_MUTED_COLOR = "brand_dark_muted_color"
    BRAND_DARK_BORDER_COLOR = "brand_dark_border_color"
    BRAND_DARK_SUCCESS_COLOR = "brand_dark_success_color"
    BRAND_DARK_WARNING_COLOR = "brand_dark_warning_color"
    BRAND_DARK_DANGER_COLOR = "brand_dark_danger_color"

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
    SMTP_FROM_NAME = "smtp_from_name"
    SMTP_USE_TLS = "smtp_use_tls"
    SMTP_USE_SSL = "smtp_use_ssl"

    # Withdrawals
    # WITHDRAWAL_FEE_ENABLED / WITHDRAWAL_FEE_FLAT are retained as legacy
    # constants so older rows/scripts do not crash, but they no longer
    # participate in fee calculation. The live product rule is percentage-only.
    WITHDRAWAL_FEE_ENABLED = "withdrawal_fee_enabled"
    WITHDRAWAL_FEE_FLAT = "withdrawal_fee_flat"
    WITHDRAWAL_FEE_PERCENT = "withdrawal_fee_percent"

    # Payments
    PAYMENT_PROVIDER = "payment_provider"
    PAYSTACK_PUBLIC_KEY = "paystack_public_key"
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

    # Background workers / scheduled operations
    WORKER_ENABLED = "worker_enabled"
    WORKER_PAYMENT_VERIFICATION_INTERVAL_SECONDS = "worker_payment_verification_interval_seconds"
    WORKER_RECONCILIATION_INTERVAL_SECONDS = "worker_reconciliation_interval_seconds"
    WORKER_WITHDRAWAL_MONITOR_INTERVAL_SECONDS = "worker_withdrawal_monitor_interval_seconds"
    WORKER_SESSION_CLEANUP_INTERVAL_SECONDS = "worker_session_cleanup_interval_seconds"
    WORKER_NOTIFICATION_CLEANUP_INTERVAL_SECONDS = "worker_notification_cleanup_interval_seconds"
    WORKER_IDEMPOTENCY_CLEANUP_INTERVAL_SECONDS = "worker_idempotency_cleanup_interval_seconds"
    WORKER_SESSION_RETENTION_DAYS = "worker_session_retention_days"
    WORKER_IDEMPOTENCY_RETENTION_HOURS = "worker_idempotency_retention_hours"

    # Runtime HTTP policy
    CORS_ALLOWED_ORIGINS = "cors_allowed_origins"
