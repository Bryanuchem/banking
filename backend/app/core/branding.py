from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.services.setting_service import SettingService


class BrandThemeTokens(BaseModel):
    primary: str
    secondary: str
    accent: str
    background: str
    surface: str
    surface_alt: str
    text: str
    muted: str
    border: str
    success: str
    warning: str
    danger: str


class PublicBranding(BaseModel):
    brand_name: str
    brand_short_name: str
    brand_tagline: str
    support_email: str | None
    support_phone: str | None
    support_whatsapp_url: str | None
    support_telegram_url: str | None
    support_hours: str | None
    social_facebook_url: str | None
    social_instagram_url: str | None
    social_x_url: str | None
    social_linkedin_url: str | None
    social_youtube_url: str | None
    social_tiktok_url: str | None
    social_discord_url: str | None
    landing_eyebrow: str
    landing_title: str
    landing_description: str
    landing_primary_cta_label: str
    landing_secondary_cta_label: str
    landing_feature_1_title: str
    landing_feature_1_description: str
    landing_feature_2_title: str
    landing_feature_2_description: str
    landing_feature_3_title: str
    landing_feature_3_description: str
    logo_url: str | None
    favicon_url: str | None
    primary_currency: str
    brand_theme_light: BrandThemeTokens
    brand_theme_dark: BrandThemeTokens


def _theme(
    db: Session,
    *,
    primary: str,
    secondary: str,
    accent: str,
    background: str,
    surface: str,
    surface_alt: str,
    text: str,
    muted: str,
    border: str,
    success: str,
    warning: str,
    danger: str,
) -> BrandThemeTokens:
    return BrandThemeTokens(
        primary=SettingService.get_string(db, primary),
        secondary=SettingService.get_string(db, secondary),
        accent=SettingService.get_string(db, accent),
        background=SettingService.get_string(db, background),
        surface=SettingService.get_string(db, surface),
        surface_alt=SettingService.get_string(db, surface_alt),
        text=SettingService.get_string(db, text),
        muted=SettingService.get_string(db, muted),
        border=SettingService.get_string(db, border),
        success=SettingService.get_string(db, success),
        warning=SettingService.get_string(db, warning),
        danger=SettingService.get_string(db, danger),
    )


def get_public_branding(db: Session) -> PublicBranding:
    return PublicBranding(
        brand_name=SettingService.get_string(
            db,
            SettingKeys.BRAND_NAME,
            "Banking",
        ),
        brand_short_name=SettingService.get_string(
            db,
            SettingKeys.BRAND_SHORT_NAME,
            "Banking",
        ),
        brand_tagline=SettingService.get_string(
            db,
            SettingKeys.BRAND_TAGLINE,
            "Private banking, clearly managed.",
        ),
        support_email=SettingService.get_string(
            db,
            SettingKeys.SUPPORT_EMAIL,
            "",
        ) or None,
        support_phone=SettingService.get_string(
            db,
            SettingKeys.SUPPORT_PHONE,
            "",
        ) or None,
        support_whatsapp_url=SettingService.get_string(
            db,
            SettingKeys.SUPPORT_WHATSAPP_URL,
            "",
        ) or None,
        support_telegram_url=SettingService.get_string(
            db,
            SettingKeys.SUPPORT_TELEGRAM_URL,
            "",
        ) or None,
        support_hours=SettingService.get_string(
            db,
            SettingKeys.SUPPORT_HOURS,
            "",
        ) or None,
        social_facebook_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_FACEBOOK_URL,
            "",
        ) or None,
        social_instagram_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_INSTAGRAM_URL,
            "",
        ) or None,
        social_x_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_X_URL,
            "",
        ) or None,
        social_linkedin_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_LINKEDIN_URL,
            "",
        ) or None,
        social_youtube_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_YOUTUBE_URL,
            "",
        ) or None,
        social_tiktok_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_TIKTOK_URL,
            "",
        ) or None,
        social_discord_url=SettingService.get_string(
            db,
            SettingKeys.SOCIAL_DISCORD_URL,
            "",
        ) or None,
        landing_eyebrow=SettingService.get_string(
            db,
            SettingKeys.LANDING_EYEBROW,
            "BANKING BUILT AROUND YOU",
        ),
        landing_title=SettingService.get_string(
            db,
            SettingKeys.LANDING_TITLE,
            "Your money, clearly managed.",
        ),
        landing_description=SettingService.get_string(
            db,
            SettingKeys.LANDING_DESCRIPTION,
            "Move money, make deposits, manage withdrawals and keep your account security in one calm, secure place.",
        ),
        landing_primary_cta_label=SettingService.get_string(
            db,
            SettingKeys.LANDING_PRIMARY_CTA_LABEL,
            "Create your account",
        ),
        landing_secondary_cta_label=SettingService.get_string(
            db,
            SettingKeys.LANDING_SECONDARY_CTA_LABEL,
            "Sign in",
        ),
        landing_feature_1_title=SettingService.get_string(
            db,
            SettingKeys.LANDING_FEATURE_1_TITLE,
            "Move money with confidence",
        ),
        landing_feature_1_description=SettingService.get_string(
            db,
            SettingKeys.LANDING_FEATURE_1_DESCRIPTION,
            "Send funds with recipient verification, review steps and protected confirmation.",
        ),
        landing_feature_2_title=SettingService.get_string(
            db,
            SettingKeys.LANDING_FEATURE_2_TITLE,
            "Deposit and withdraw",
        ),
        landing_feature_2_description=SettingService.get_string(
            db,
            SettingKeys.LANDING_FEATURE_2_DESCRIPTION,
            "Use configured payment providers while your balances and transaction history stay in sync.",
        ),
        landing_feature_3_title=SettingService.get_string(
            db,
            SettingKeys.LANDING_FEATURE_3_TITLE,
            "Security that stays visible",
        ),
        landing_feature_3_description=SettingService.get_string(
            db,
            SettingKeys.LANDING_FEATURE_3_DESCRIPTION,
            "Two-factor authentication, recovery codes and active-session controls are built into your account.",
        ),
        logo_url=SettingService.get_string(
            db,
            SettingKeys.LOGO_URL,
            "",
        ) or None,
        favicon_url=SettingService.get_string(
            db,
            SettingKeys.FAVICON_URL,
            "",
        ) or None,
        primary_currency=SettingService.get_string(
            db,
            SettingKeys.PRIMARY_CURRENCY,
            "USD",
        ),
        brand_theme_light=_theme(
            db,
            primary=SettingKeys.BRAND_LIGHT_PRIMARY_COLOR,
            secondary=SettingKeys.BRAND_LIGHT_SECONDARY_COLOR,
            accent=SettingKeys.BRAND_LIGHT_ACCENT_COLOR,
            background=SettingKeys.BRAND_LIGHT_BACKGROUND_COLOR,
            surface=SettingKeys.BRAND_LIGHT_SURFACE_COLOR,
            surface_alt=SettingKeys.BRAND_LIGHT_SURFACE_ALT_COLOR,
            text=SettingKeys.BRAND_LIGHT_TEXT_COLOR,
            muted=SettingKeys.BRAND_LIGHT_MUTED_COLOR,
            border=SettingKeys.BRAND_LIGHT_BORDER_COLOR,
            success=SettingKeys.BRAND_LIGHT_SUCCESS_COLOR,
            warning=SettingKeys.BRAND_LIGHT_WARNING_COLOR,
            danger=SettingKeys.BRAND_LIGHT_DANGER_COLOR,
        ),
        brand_theme_dark=_theme(
            db,
            primary=SettingKeys.BRAND_DARK_PRIMARY_COLOR,
            secondary=SettingKeys.BRAND_DARK_SECONDARY_COLOR,
            accent=SettingKeys.BRAND_DARK_ACCENT_COLOR,
            background=SettingKeys.BRAND_DARK_BACKGROUND_COLOR,
            surface=SettingKeys.BRAND_DARK_SURFACE_COLOR,
            surface_alt=SettingKeys.BRAND_DARK_SURFACE_ALT_COLOR,
            text=SettingKeys.BRAND_DARK_TEXT_COLOR,
            muted=SettingKeys.BRAND_DARK_MUTED_COLOR,
            border=SettingKeys.BRAND_DARK_BORDER_COLOR,
            success=SettingKeys.BRAND_DARK_SUCCESS_COLOR,
            warning=SettingKeys.BRAND_DARK_WARNING_COLOR,
            danger=SettingKeys.BRAND_DARK_DANGER_COLOR,
        ),
    )
