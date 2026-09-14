from app.constants.setting_definition import DEFINITIONS_BY_KEY
from app.constants.setting_key import SettingKeys
from app.middleware.database_cors import (
    DEFAULT_CORS_ORIGINS,
    normalize_origins,
)


def test_cors_is_a_db_backed_setting() -> None:
    definition = DEFINITIONS_BY_KEY[
        SettingKeys.CORS_ALLOWED_ORIGINS
    ]
    assert definition.category == "security"
    assert definition.value_type == "json"


def test_default_cors_origins_include_customer_and_admin_dev_apps() -> None:
    assert "http://localhost:5173" in DEFAULT_CORS_ORIGINS
    assert "http://localhost:5174" in DEFAULT_CORS_ORIGINS


def test_normalize_origins_deduplicates_and_strips_trailing_slash() -> None:
    assert normalize_origins(
        [
            "http://localhost:5173/",
            "http://localhost:5173",
            "https://admin.example.com/",
            "",
            "not-an-origin",
        ]
    ) == [
        "http://localhost:5173",
        "https://admin.example.com",
    ]


def test_empty_cors_setting_uses_seed_defaults() -> None:
    assert normalize_origins([]) == DEFAULT_CORS_ORIGINS
