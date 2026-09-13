from pydantic import BaseModel

from app.core.settings import settings


class PublicBranding(BaseModel):
    brand_name: str
    brand_short_name: str
    support_email: str | None
    support_phone: str | None
    logo_url: str | None
    favicon_url: str | None
    primary_currency: str


def get_public_branding() -> PublicBranding:
    return PublicBranding(
        brand_name=settings.brand_name,
        brand_short_name=settings.brand_short_name,
        support_email=settings.support_email,
        support_phone=settings.support_phone,
        logo_url=settings.logo_url,
        favicon_url=settings.favicon_url,
        primary_currency=settings.primary_currency,
    )
