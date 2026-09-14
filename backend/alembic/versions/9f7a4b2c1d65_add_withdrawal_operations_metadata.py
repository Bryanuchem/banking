"""add withdrawal operations metadata

Revision ID: 9f7a4b2c1d65
Revises: 8c6f2a1d9b40
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f7a4b2c1d65"
down_revision: Union[str, None] = "8c6f2a1d9b40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "withdrawals",
        sa.Column(
            "external_reference",
            sa.String(length=120),
            nullable=True,
        ),
    )
    op.add_column(
        "withdrawals",
        sa.Column(
            "admin_note",
            sa.Text(),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_withdrawals_external_reference",
        "withdrawals",
        ["external_reference"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_withdrawals_external_reference",
        table_name="withdrawals",
    )
    op.drop_column("withdrawals", "admin_note")
    op.drop_column("withdrawals", "external_reference")
