import re

from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.services.setting_service import SettingService

password_hash = PasswordHash.recommended()


def hash_password(value: str) -> str:
    return password_hash.hash(value)


def verify_password(plain_value: str, hashed_value: str) -> bool:
    return password_hash.verify(plain_value, hashed_value)


def validate_password_policy(db: Session, password: str) -> None:
    minimum = SettingService.get_integer(db, SettingKeys.PASSWORD_MIN_LENGTH, 8)
    if len(password) < minimum:
        raise ValueError(f"Password must be at least {minimum} characters long.")
    if SettingService.get_boolean(db, SettingKeys.REQUIRE_UPPERCASE, True) and not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain an uppercase letter.")
    if SettingService.get_boolean(db, SettingKeys.REQUIRE_NUMBERS, True) and not re.search(r"\d", password):
        raise ValueError("Password must contain a number.")
    if SettingService.get_boolean(db, SettingKeys.REQUIRE_SPECIAL_CHARACTERS, True) and not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Password must contain a special character.")
