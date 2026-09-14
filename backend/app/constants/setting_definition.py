from dataclasses import dataclass
from typing import Any

from app.constants.setting_key import SettingKeys


@dataclass(frozen=True)
class SettingDefinition:
    category: str
    key: str
    value_type: str
    default: Any
    is_editable: bool = True
    is_secret: bool = False
    description: str | None = None
    formula: str | None = None


SETTING_DEFINITIONS = (
    SettingDefinition("branding", SettingKeys.BRAND_NAME, "string", "Banking"),
    SettingDefinition("branding", SettingKeys.BRAND_SHORT_NAME, "string", "Banking"),
    SettingDefinition("branding", SettingKeys.LOGO_URL, "string", ""),
    SettingDefinition("branding", SettingKeys.FAVICON_URL, "string", ""),
    SettingDefinition("branding", SettingKeys.PRIMARY_CURRENCY, "string", "USD"),
    SettingDefinition(
        "branding",
        SettingKeys.BRAND_TAGLINE,
        "string",
        "Private banking, clearly managed.",
        description="Short brand line used on the public site and footer.",
    ),

    # Public landing content. Text is DB-backed so white-label deployments do
    # not need a frontend rebuild for ordinary copy changes.
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_EYEBROW,
        "string",
        "BANKING BUILT AROUND YOU",
        description="Small uppercase line above the landing-page headline.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_TITLE,
        "string",
        "Your money, clearly managed.",
        description="Main public landing-page headline.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_DESCRIPTION,
        "string",
        "Move money, make deposits, manage withdrawals and keep your account security in one calm, secure place.",
        description="Primary landing-page introduction.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_PRIMARY_CTA_LABEL,
        "string",
        "Create your account",
        description="Primary landing-page call-to-action label.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_SECONDARY_CTA_LABEL,
        "string",
        "Sign in",
        description="Secondary landing-page call-to-action label.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_FEATURE_1_TITLE,
        "string",
        "Move money with confidence",
        description="Landing feature card 1 title.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_FEATURE_1_DESCRIPTION,
        "string",
        "Send funds with recipient verification, review steps and protected confirmation.",
        description="Landing feature card 1 description.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_FEATURE_2_TITLE,
        "string",
        "Deposit and withdraw",
        description="Landing feature card 2 title.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_FEATURE_2_DESCRIPTION,
        "string",
        "Use configured payment providers while your balances and transaction history stay in sync.",
        description="Landing feature card 2 description.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_FEATURE_3_TITLE,
        "string",
        "Security that stays visible",
        description="Landing feature card 3 title.",
    ),
    SettingDefinition(
        "landing",
        SettingKeys.LANDING_FEATURE_3_DESCRIPTION,
        "string",
        "Two-factor authentication, recovery codes and active-session controls are built into your account.",
        description="Landing feature card 3 description.",
    ),

    SettingDefinition(
        "support",
        SettingKeys.SUPPORT_EMAIL,
        "string",
        "",
        description="Customer support email shown publicly and inside the customer portal.",
    ),
    SettingDefinition(
        "support",
        SettingKeys.SUPPORT_PHONE,
        "string",
        "",
        description="Customer support phone number shown publicly and inside the customer portal.",
    ),
    SettingDefinition(
        "support",
        SettingKeys.SUPPORT_WHATSAPP_URL,
        "string",
        "",
        description="Full WhatsApp support URL, for example https://wa.me/15551234567.",
    ),
    SettingDefinition(
        "support",
        SettingKeys.SUPPORT_TELEGRAM_URL,
        "string",
        "",
        description="Full Telegram support URL.",
    ),
    SettingDefinition(
        "support",
        SettingKeys.SUPPORT_HOURS,
        "string",
        "",
        description="Optional human-readable support availability, for example Mon-Fri, 8am-6pm.",
    ),

    SettingDefinition("social", SettingKeys.SOCIAL_FACEBOOK_URL, "string", "", description="Public Facebook profile URL."),
    SettingDefinition("social", SettingKeys.SOCIAL_INSTAGRAM_URL, "string", "", description="Public Instagram profile URL."),
    SettingDefinition("social", SettingKeys.SOCIAL_X_URL, "string", "", description="Public X profile URL."),
    SettingDefinition("social", SettingKeys.SOCIAL_LINKEDIN_URL, "string", "", description="Public LinkedIn profile URL."),
    SettingDefinition("social", SettingKeys.SOCIAL_YOUTUBE_URL, "string", "", description="Public YouTube channel URL."),
    SettingDefinition("social", SettingKeys.SOCIAL_TIKTOK_URL, "string", "", description="Public TikTok profile URL."),
    SettingDefinition("social", SettingKeys.SOCIAL_DISCORD_URL, "string", "", description="Public Discord community/invite URL."),

    # Calm, professional default light theme
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_PRIMARY_COLOR, "string", "#111827"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_SECONDARY_COLOR, "string", "#374151"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_ACCENT_COLOR, "string", "#315C7C"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_BACKGROUND_COLOR, "string", "#F7F7F5"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_SURFACE_COLOR, "string", "#FFFFFF"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_SURFACE_ALT_COLOR, "string", "#F1F3F5"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_TEXT_COLOR, "string", "#111827"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_MUTED_COLOR, "string", "#6B7280"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_BORDER_COLOR, "string", "#E5E7EB"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_SUCCESS_COLOR, "string", "#2F6F4E"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_WARNING_COLOR, "string", "#A56B1F"),
    SettingDefinition("branding", SettingKeys.BRAND_LIGHT_DANGER_COLOR, "string", "#A44747"),

    # Soft dark theme, deliberately not a simple inversion of light mode
    SettingDefinition("branding", SettingKeys.BRAND_DARK_PRIMARY_COLOR, "string", "#E5E7EB"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_SECONDARY_COLOR, "string", "#CBD5E1"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_ACCENT_COLOR, "string", "#7FA3BF"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_BACKGROUND_COLOR, "string", "#0B0F14"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_SURFACE_COLOR, "string", "#11161D"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_SURFACE_ALT_COLOR, "string", "#151B23"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_TEXT_COLOR, "string", "#F3F4F6"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_MUTED_COLOR, "string", "#9CA3AF"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_BORDER_COLOR, "string", "#252B33"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_SUCCESS_COLOR, "string", "#6AA889"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_WARNING_COLOR, "string", "#D5A35B"),
    SettingDefinition("branding", SettingKeys.BRAND_DARK_DANGER_COLOR, "string", "#D17A7A"),

    SettingDefinition("authentication", SettingKeys.REGISTRATION_ENABLED, "boolean", True),
    SettingDefinition("authentication", SettingKeys.EMAIL_VERIFICATION_REQUIRED, "boolean", False),
    SettingDefinition("authentication", SettingKeys.JWT_EXPIRE_MINUTES, "number", 30),
    SettingDefinition("authentication", SettingKeys.REMEMBER_ME_EXPIRE_DAYS, "number", 30),
    SettingDefinition("authentication", SettingKeys.MAX_LOGIN_ATTEMPTS, "number", 5),
    SettingDefinition("authentication", SettingKeys.LOGIN_LOCKOUT_MINUTES, "number", 15),
    SettingDefinition("authentication", SettingKeys.PASSWORD_MIN_LENGTH, "number", 8),
    SettingDefinition("authentication", SettingKeys.REQUIRE_SPECIAL_CHARACTERS, "boolean", True),
    SettingDefinition("authentication", SettingKeys.REQUIRE_UPPERCASE, "boolean", True),
    SettingDefinition("authentication", SettingKeys.REQUIRE_NUMBERS, "boolean", True),

    SettingDefinition("two_factor", SettingKeys.TWO_FACTOR_AUTH_POLICY, "string", "optional"),
    SettingDefinition("two_factor", SettingKeys.TWO_FACTOR_ISSUER, "string", "Banking"),
    SettingDefinition("two_factor", SettingKeys.TWO_FACTOR_RECOVERY_CODE_COUNT, "number", 10),

    SettingDefinition("otp", SettingKeys.OTP_EXPIRY_MINUTES, "number", 10),
    SettingDefinition("otp", SettingKeys.OTP_LENGTH, "number", 6),

    SettingDefinition("smtp", SettingKeys.SMTP_ENABLED, "boolean", False),
    SettingDefinition("smtp", SettingKeys.SMTP_HOST, "string", ""),
    SettingDefinition("smtp", SettingKeys.SMTP_PORT, "number", 587),
    SettingDefinition("smtp", SettingKeys.SMTP_USERNAME, "string", ""),
    SettingDefinition("smtp", SettingKeys.SMTP_PASSWORD, "string", "", is_secret=True),
    SettingDefinition("smtp", SettingKeys.SMTP_FROM_EMAIL, "string", ""),
    SettingDefinition("smtp", SettingKeys.SMTP_FROM_NAME, "string", "Banking"),
    SettingDefinition("smtp", SettingKeys.SMTP_USE_TLS, "boolean", True),
    SettingDefinition("smtp", SettingKeys.SMTP_USE_SSL, "boolean", False),

    SettingDefinition(
        "withdrawals",
        SettingKeys.WITHDRAWAL_FEE_PERCENT,
        "string",
        "1.00",
        description=(
            "Mandatory processing fee percentage charged on every withdrawal. "
            "Changing this value affects new withdrawals only."
        ),
        formula="fee = withdrawal_amount × withdrawal_fee_percent ÷ 100",
    ),

    SettingDefinition("payments", SettingKeys.PAYMENT_PROVIDER, "string", "stripe"),
    SettingDefinition("payments", SettingKeys.PAYSTACK_PUBLIC_KEY, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYSTACK_SECRET_KEY, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.PAYSTACK_CALLBACK_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.STRIPE_SECRET_KEY, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.STRIPE_WEBHOOK_SECRET, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.STRIPE_SUCCESS_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.STRIPE_CANCEL_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.STRIPE_CALLBACK_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYPAL_ENVIRONMENT, "string", "sandbox"),
    SettingDefinition("payments", SettingKeys.PAYPAL_CLIENT_ID, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYPAL_CLIENT_SECRET, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.PAYPAL_WEBHOOK_ID, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.PAYPAL_RETURN_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYPAL_CANCEL_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.CASHAPP_ENVIRONMENT, "string", "sandbox"),
    SettingDefinition("payments", SettingKeys.CASHAPP_CLIENT_ID, "string", ""),
    SettingDefinition("payments", SettingKeys.CASHAPP_API_KEY_ID, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.CASHAPP_API_SECRET, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.CASHAPP_MERCHANT_ID, "string", ""),
    SettingDefinition("payments", SettingKeys.CASHAPP_REGION, "string", "PDX"),
    SettingDefinition("payments", SettingKeys.CASHAPP_REDIRECT_URL, "string", ""),

    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_ENABLED, "boolean", True),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_REGISTER_PER_MINUTE, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_LOGIN_PER_MINUTE, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_FORGOT_PASSWORD_PER_15_MINUTES, "number", 3),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_ACCOUNT_LOOKUP_PER_MINUTE, "number", 30),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_TRANSFER_PER_MINUTE, "number", 10),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_WITHDRAWAL_PER_HOUR, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_PAYMENT_PER_HOUR, "number", 10),

    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_ADMIN_PER_MINUTE, "number", 60),

    # Runtime HTTP policy. Operational configuration, not a secret.
    SettingDefinition(
        "security",
        SettingKeys.CORS_ALLOWED_ORIGINS,
        "json",
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ],
        description=(
            "Allowed browser origins for customer/admin frontends. "
            "Use full origins such as https://app.example.com."
        ),
    ),

    # Background worker scheduling. These are runtime settings, so schedules can
    # be changed without rebuilding or restarting the API process.
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_ENABLED,
        "boolean",
        True,
        description="Allow the standalone background runner to execute due jobs.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_PAYMENT_VERIFICATION_INTERVAL_SECONDS,
        "number",
        60,
        description="How often pending payment attempts are re-verified.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_RECONCILIATION_INTERVAL_SECONDS,
        "number",
        300,
        description="How often account and ledger balances are reconciled.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_WITHDRAWAL_MONITOR_INTERVAL_SECONDS,
        "number",
        120,
        description="How often the runner checks for withdrawals awaiting review.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_SESSION_CLEANUP_INTERVAL_SECONDS,
        "number",
        600,
        description="How often old expired or revoked sessions are pruned.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_NOTIFICATION_CLEANUP_INTERVAL_SECONDS,
        "number",
        1800,
        description="How often expired in-app notifications are removed.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_IDEMPOTENCY_CLEANUP_INTERVAL_SECONDS,
        "number",
        3600,
        description="How often old idempotency records are pruned.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_SESSION_RETENTION_DAYS,
        "number",
        30,
        description="Days to retain expired or revoked session records.",
    ),
    SettingDefinition(
        "operations",
        SettingKeys.WORKER_IDEMPOTENCY_RETENTION_HOURS,
        "number",
        168,
        description="Hours to retain completed idempotency keys.",
    ),

)

DEFINITIONS_BY_KEY = {item.key: item for item in SETTING_DEFINITIONS}
