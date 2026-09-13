import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_definition import DEFINITIONS_BY_KEY, SETTING_DEFINITIONS
from app.models.setting import Setting
from app.services.setting_secret_service import SettingSecretService


class SettingService:
    @staticmethod
    def _serialize(value: Any, value_type: str) -> str:
        if value_type == "boolean":
            return "true" if bool(value) else "false"
        if value_type == "json":
            return json.dumps(value)
        return str(value)

    @staticmethod
    def _deserialize(value: str, value_type: str) -> Any:
        if value_type == "boolean":
            return value.strip().lower() in {"1", "true", "yes", "on"}
        if value_type == "number":
            return int(value)
        if value_type == "json":
            return json.loads(value or "null")
        return value

    @classmethod
    def get(cls, db: Session, key: str, *, default: Any = None) -> Any:
        definition = DEFINITIONS_BY_KEY.get(key)
        row = db.scalar(select(Setting).where(Setting.key == key))
        if row is None:
            if definition is not None:
                return definition.default
            return default
        raw = row.value
        if definition and definition.is_secret:
            raw = SettingSecretService.decrypt(raw)
        return cls._deserialize(raw, row.value_type)

    @classmethod
    def get_string(cls, db: Session, key: str, default: str = "") -> str:
        value = cls.get(db, key, default=default)
        return str(value if value is not None else default)

    @classmethod
    def get_integer(cls, db: Session, key: str, default: int = 0) -> int:
        return int(cls.get(db, key, default=default))

    @classmethod
    def get_boolean(cls, db: Session, key: str, default: bool = False) -> bool:
        return bool(cls.get(db, key, default=default))

    @classmethod
    def set(cls, db: Session, key: str, value: Any) -> Setting:
        definition = DEFINITIONS_BY_KEY.get(key)
        if definition is None:
            raise KeyError(f"Unknown setting key: {key}")
        row = db.scalar(select(Setting).where(Setting.key == key))
        serialized = cls._serialize(value, definition.value_type)
        if definition.is_secret:
            serialized = SettingSecretService.encrypt(serialized)
        if row is None:
            row = Setting(
                category=definition.category,
                key=definition.key,
                value=serialized,
                value_type=definition.value_type,
                is_editable=definition.is_editable,
            )
            db.add(row)
        else:
            row.value = serialized
            row.value_type = definition.value_type
        db.commit()
        db.refresh(row)
        return row

    @classmethod
    def ensure_defaults(cls, db: Session) -> int:
        created = 0
        for definition in SETTING_DEFINITIONS:
            existing = db.scalar(select(Setting).where(Setting.key == definition.key))
            if existing is not None:
                continue
            serialized = cls._serialize(definition.default, definition.value_type)
            if definition.is_secret:
                serialized = SettingSecretService.encrypt(serialized)
            db.add(
                Setting(
                    category=definition.category,
                    key=definition.key,
                    value=serialized,
                    value_type=definition.value_type,
                    is_editable=definition.is_editable,
                )
            )
            created += 1
        db.commit()
        return created
