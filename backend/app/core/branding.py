from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.services.setting_service import SettingService


class PublicBranding(BaseModel):
    brand_name: str
    brand_short_name: str
    support_email: str | None
    support_phone: str | None
    logo_url: str | None
    favicon_url: str | None
    primary_currency: str


def get_public_branding(db: Session) -> PublicBranding:
    return PublicBranding(
        brand_name=SettingService.get_string(db, SettingKeys.BRAND_NAME, "Banking"),
        brand_short_name=SettingService.get_string(db, SettingKeys.BRAND_SHORT_NAME, "Banking"),
        support_email=SettingService.get_string(db, SettingKeys.SUPPORT_EMAIL, "") or None,
        support_phone=SettingService.get_string(db, SettingKeys.SUPPORT_PHONE, "") or None,
        logo_url=SettingService.get_string(db, SettingKeys.LOGO_URL, "") or None,
        favicon_url=SettingService.get_string(db, SettingKeys.FAVICON_URL, "") or None,
        primary_currency=SettingService.get_string(db, SettingKeys.PRIMARY_CURRENCY, "NGN"),
    )
