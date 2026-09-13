from app.constants.setting_definition import DEFINITIONS_BY_KEY
from app.constants.setting_key import SettingKeys


def test_branding_theme_settings_are_registered() -> None:
    keys = {
        SettingKeys.BRAND_LIGHT_PRIMARY_COLOR,
        SettingKeys.BRAND_LIGHT_SECONDARY_COLOR,
        SettingKeys.BRAND_LIGHT_ACCENT_COLOR,
        SettingKeys.BRAND_LIGHT_BACKGROUND_COLOR,
        SettingKeys.BRAND_LIGHT_SURFACE_COLOR,
        SettingKeys.BRAND_LIGHT_SURFACE_ALT_COLOR,
        SettingKeys.BRAND_LIGHT_TEXT_COLOR,
        SettingKeys.BRAND_LIGHT_MUTED_COLOR,
        SettingKeys.BRAND_LIGHT_BORDER_COLOR,
        SettingKeys.BRAND_LIGHT_SUCCESS_COLOR,
        SettingKeys.BRAND_LIGHT_WARNING_COLOR,
        SettingKeys.BRAND_LIGHT_DANGER_COLOR,
        SettingKeys.BRAND_DARK_PRIMARY_COLOR,
        SettingKeys.BRAND_DARK_SECONDARY_COLOR,
        SettingKeys.BRAND_DARK_ACCENT_COLOR,
        SettingKeys.BRAND_DARK_BACKGROUND_COLOR,
        SettingKeys.BRAND_DARK_SURFACE_COLOR,
        SettingKeys.BRAND_DARK_SURFACE_ALT_COLOR,
        SettingKeys.BRAND_DARK_TEXT_COLOR,
        SettingKeys.BRAND_DARK_MUTED_COLOR,
        SettingKeys.BRAND_DARK_BORDER_COLOR,
        SettingKeys.BRAND_DARK_SUCCESS_COLOR,
        SettingKeys.BRAND_DARK_WARNING_COLOR,
        SettingKeys.BRAND_DARK_DANGER_COLOR,
    }

    assert keys <= DEFINITIONS_BY_KEY.keys()
    assert all(DEFINITIONS_BY_KEY[key].category == "branding" for key in keys)


def test_default_branding_palette_is_complete() -> None:
    light_keys = (
        SettingKeys.BRAND_LIGHT_PRIMARY_COLOR,
        SettingKeys.BRAND_LIGHT_SECONDARY_COLOR,
        SettingKeys.BRAND_LIGHT_ACCENT_COLOR,
        SettingKeys.BRAND_LIGHT_BACKGROUND_COLOR,
        SettingKeys.BRAND_LIGHT_SURFACE_COLOR,
        SettingKeys.BRAND_LIGHT_SURFACE_ALT_COLOR,
        SettingKeys.BRAND_LIGHT_TEXT_COLOR,
        SettingKeys.BRAND_LIGHT_MUTED_COLOR,
        SettingKeys.BRAND_LIGHT_BORDER_COLOR,
        SettingKeys.BRAND_LIGHT_SUCCESS_COLOR,
        SettingKeys.BRAND_LIGHT_WARNING_COLOR,
        SettingKeys.BRAND_LIGHT_DANGER_COLOR,
    )
    dark_keys = (
        SettingKeys.BRAND_DARK_PRIMARY_COLOR,
        SettingKeys.BRAND_DARK_SECONDARY_COLOR,
        SettingKeys.BRAND_DARK_ACCENT_COLOR,
        SettingKeys.BRAND_DARK_BACKGROUND_COLOR,
        SettingKeys.BRAND_DARK_SURFACE_COLOR,
        SettingKeys.BRAND_DARK_SURFACE_ALT_COLOR,
        SettingKeys.BRAND_DARK_TEXT_COLOR,
        SettingKeys.BRAND_DARK_MUTED_COLOR,
        SettingKeys.BRAND_DARK_BORDER_COLOR,
        SettingKeys.BRAND_DARK_SUCCESS_COLOR,
        SettingKeys.BRAND_DARK_WARNING_COLOR,
        SettingKeys.BRAND_DARK_DANGER_COLOR,
    )

    for key in (*light_keys, *dark_keys):
        value = DEFINITIONS_BY_KEY[key].default
        assert isinstance(value, str)
        assert value.startswith("#")
        assert len(value) == 7
