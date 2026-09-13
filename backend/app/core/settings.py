from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    """Bootstrap/infrastructure configuration only.

    Runtime product policy belongs in the database-backed settings system.
    Secrets needed before the database can be trusted, such as the application
    signing key and internal service token, remain environment-backed.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Banking API"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    app_secret_key: str = Field(default="change-me", repr=False)
    internal_service_token: str = Field(default="", repr=False)

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
