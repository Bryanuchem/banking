from __future__ import annotations

import hashlib
import json
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.idempotency_record import IdempotencyRecord


class IdempotencyService:
    @staticmethod
    def fingerprint(payload: dict[str, Any]) -> str:
        encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode()
        return hashlib.sha256(encoded).hexdigest()

    @staticmethod
    def require_key(value: str | None) -> str:
        key = (value or "").strip()
        if not key:
            raise HTTPException(status_code=400, detail="Idempotency-Key header is required.")
        if len(key) > 128:
            raise HTTPException(status_code=400, detail="Idempotency-Key is too long.")
        return key

    @classmethod
    def claim(
        cls,
        db: Session,
        *,
        user_id: UUID,
        scope: str,
        key: str,
        fingerprint: str,
    ) -> tuple[IdempotencyRecord, bool]:
        statement = (
            insert(IdempotencyRecord)
            .values(
                user_id=user_id,
                scope=scope,
                key=key,
                request_fingerprint=fingerprint,
            )
            .on_conflict_do_nothing(
                constraint="uq_idempotency_user_scope_key"
            )
            .returning(IdempotencyRecord.id)
        )
        inserted_id = db.scalar(statement)
        if inserted_id is not None:
            record = db.get(IdempotencyRecord, inserted_id)
            assert record is not None
            return record, True

        record = db.scalar(
            select(IdempotencyRecord).where(
                IdempotencyRecord.user_id == user_id,
                IdempotencyRecord.scope == scope,
                IdempotencyRecord.key == key,
            )
        )
        if record is None:
            raise HTTPException(status_code=409, detail="Unable to resolve idempotent request.")
        if record.request_fingerprint != fingerprint:
            raise HTTPException(
                status_code=409,
                detail="This Idempotency-Key was already used with different request data.",
            )
        return record, False

    @staticmethod
    def bind(record: IdempotencyRecord, *, resource_type: str, resource_id: UUID) -> None:
        record.resource_type = resource_type
        record.resource_id = resource_id
