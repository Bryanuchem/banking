"""allow Cloudflare Quick Tunnel frontend origins

Revision ID: 4c8e0f6a2b31
Revises: 3b7d9e5f1a20
"""
from __future__ import annotations

import json

from alembic import op
import sqlalchemy as sa


revision = "4c8e0f6a2b31"
down_revision = "3b7d9e5f1a20"
branch_labels = None
depends_on = None

KEY = "cors_allowed_origins"
WILDCARD = "*.trycloudflare.com"


def _load_origins(raw: str) -> list[str]:
    try:
        value = json.loads(raw)
    except (TypeError, ValueError):
        return []

    if not isinstance(value, list):
        return []

    return [
        item
        for item in value
        if isinstance(item, str)
    ]


def upgrade() -> None:
    connection = op.get_bind()
    row = connection.execute(
        sa.text(
            """
            SELECT id, value
            FROM settings
            WHERE key = :key
            LIMIT 1
            """
        ),
        {"key": KEY},
    ).mappings().first()

    if row is None:
        return

    origins = _load_origins(row["value"])
    if WILDCARD in origins:
        return

    origins.append(WILDCARD)

    connection.execute(
        sa.text(
            """
            UPDATE settings
            SET value = :value,
                updated_at = now()
            WHERE id = :id
            """
        ),
        {
            "id": row["id"],
            "value": json.dumps(origins),
        },
    )


def downgrade() -> None:
    connection = op.get_bind()
    row = connection.execute(
        sa.text(
            """
            SELECT id, value
            FROM settings
            WHERE key = :key
            LIMIT 1
            """
        ),
        {"key": KEY},
    ).mappings().first()

    if row is None:
        return

    origins = [
        item
        for item in _load_origins(
            row["value"]
        )
        if item != WILDCARD
    ]

    connection.execute(
        sa.text(
            """
            UPDATE settings
            SET value = :value,
                updated_at = now()
            WHERE id = :id
            """
        ),
        {
            "id": row["id"],
            "value": json.dumps(origins),
        },
    )
