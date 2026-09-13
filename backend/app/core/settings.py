from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Banking API"
    app_env: str = "development"
    debug: bool = True

    brand_name: str = "Banking"
    brand_short_name: str = "Banking"
    support_email: str | None = None
    support_phone: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    primary_currency: str = "NGN"

    api_v1_prefix: str = "/api/v1"

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "banking"
    db_user: str = "postgres"
    db_password: str = Field(default="", repr=False)

    smtp_enabled: bool = False
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = Field(default=None, repr=False)
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True

    otp_expiry_minutes: int = Field(default=10, ge=1, le=60)
    otp_length: int = Field(default=6, ge=4, le=8)

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
