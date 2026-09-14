from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AdminSettingItem(BaseModel):
    category: str
    key: str
    value_type: str
    is_editable: bool
    is_secret: bool
    configured: bool
    value: Any | None
    description: str | None = None
    formula: str | None = None


class AdminSettingUpdateRequest(BaseModel):
    value: Any


class AdminSettingValueUpdate(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    value: Any


class AdminSettingBatchUpdateRequest(BaseModel):
    updates: list[AdminSettingValueUpdate] = Field(min_length=1, max_length=100)


class AdminSettingBatchUpdateResponse(BaseModel):
    items: list[AdminSettingItem]


class AdminProviderSummary(BaseModel):
    provider: Literal["paystack", "stripe", "paypal", "cash-app"]
    label: str
    configured: bool
    configured_fields: int
    required_fields: int


class AdminProviderDetail(BaseModel):
    provider: Literal["paystack", "stripe", "paypal", "cash-app"]
    label: str
    configured: bool
    fields: list[AdminSettingItem]


class AdminProviderUpdateRequest(BaseModel):
    values: dict[str, Any]


class AdminTestEmailRequest(BaseModel):
    recipient: str = Field(min_length=3, max_length=320)

    @field_validator("recipient")
    @classmethod
    def validate_recipient(cls, value: str) -> str:
        candidate = value.strip()
        if (
            "@" not in candidate
            or candidate.startswith("@")
            or candidate.endswith("@")
        ):
            raise ValueError("Enter a valid recipient email address.")
        return candidate


class AdminTestEmailResponse(BaseModel):
    sent: bool = True
