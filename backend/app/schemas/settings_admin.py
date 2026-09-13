from typing import Any

from pydantic import BaseModel


class AdminSettingItem(BaseModel):
    category: str
    key: str
    value_type: str
    is_editable: bool
    is_secret: bool
    configured: bool
    value: Any | None


class AdminSettingUpdateRequest(BaseModel):
    value: Any
