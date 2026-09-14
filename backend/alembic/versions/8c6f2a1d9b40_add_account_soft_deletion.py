"""add account soft deletion

Revision ID: 8c6f2a1d9b40
Revises: 4a8c8c3ddaf2
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c6f2a1d9b40"
down_revision: Union[str, None] = "4a8c8c3ddaf2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "accounts",
        sa.Column(
            "deletion_reason",
            sa.String(length=500),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_accounts_deleted_at",
        "accounts",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_accounts_deleted_at",
        table_name="accounts",
    )
    op.drop_column("accounts", "deletion_reason")
    op.drop_column("accounts", "deleted_at")
