import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.settings import settings


class SettingSecretService:
    PREFIX = "enc:"

    @classmethod
    def _fernet(cls) -> Fernet:
        digest = hashlib.sha256(settings.app_secret_key.encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    @classmethod
    def encrypt(cls, value: str) -> str:
        if not value:
            return ""
        if value.startswith(cls.PREFIX):
            return value
        token = cls._fernet().encrypt(value.encode("utf-8")).decode("utf-8")
        return f"{cls.PREFIX}{token}"

    @classmethod
    def decrypt(cls, value: str) -> str:
        if not value:
            return ""
        if not value.startswith(cls.PREFIX):
            return value
        try:
            return cls._fernet().decrypt(value[len(cls.PREFIX):].encode("utf-8")).decode("utf-8")
        except InvalidToken as exc:
            raise RuntimeError("Unable to decrypt a secret setting. Check APP_SECRET_KEY.") from exc
