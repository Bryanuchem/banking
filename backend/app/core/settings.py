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
