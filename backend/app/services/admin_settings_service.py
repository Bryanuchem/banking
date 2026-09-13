from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_definition import DEFINITIONS_BY_KEY, SETTING_DEFINITIONS
from app.models.setting import Setting
from app.services.setting_service import SettingService


class AdminSettingsService:
    @staticmethod
    def list(db: Session) -> list[dict[str, Any]]:
        rows = {row.key: row for row in db.scalars(select(Setting)).all()}
        output: list[dict[str, Any]] = []
        for definition in SETTING_DEFINITIONS:
            row = rows.get(definition.key)
            configured = bool(row and row.value)
            if definition.is_secret:
                value = None
                configured = bool(row and row.value)
            else:
                value = SettingService.get(db, definition.key, default=definition.default)
            output.append({
                "category": definition.category,
                "key": definition.key,
                "value_type": definition.value_type,
                "is_editable": definition.is_editable,
                "is_secret": definition.is_secret,
                "configured": configured,
                "value": value,
            })
        return output

    @staticmethod
    def update(db: Session, *, key: str, value: Any) -> dict[str, Any]:
        definition = DEFINITIONS_BY_KEY.get(key)
        if definition is None:
            raise HTTPException(status_code=404, detail="Unknown setting key.")
        if not definition.is_editable:
            raise HTTPException(status_code=403, detail="This setting is not editable.")
        SettingService.set(db, key, value)
        return {
            "category": definition.category,
            "key": definition.key,
            "value_type": definition.value_type,
            "is_editable": definition.is_editable,
            "is_secret": definition.is_secret,
            "configured": True,
            "value": None if definition.is_secret else SettingService.get(db, key),
        }
