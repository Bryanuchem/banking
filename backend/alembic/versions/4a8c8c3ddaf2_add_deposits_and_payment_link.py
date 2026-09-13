"""Add first-class deposits and link payments to deposits.

Revision ID: 4a8c8c3ddaf2
Revises: c724e6155992
"""
from alembic import op
import sqlalchemy as sa
revision = "4a8c8c3ddaf2"
down_revision = "c724e6155992"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "deposits",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=True),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("transaction_id"),
    )
    op.create_index(op.f("ix_deposits_account_id"), "deposits", ["account_id"], unique=False)
    op.create_index(op.f("ix_deposits_status"), "deposits", ["status"], unique=False)
    op.create_index(op.f("ix_deposits_user_id"), "deposits", ["user_id"], unique=False)
    op.add_column("payments", sa.Column("deposit_id", sa.Uuid(), nullable=True))
    op.create_index(op.f("ix_payments_deposit_id"), "payments", ["deposit_id"], unique=False)
    op.create_foreign_key("fk_payments_deposit_id_deposits", "payments", "deposits", ["deposit_id"], ["id"], ondelete="SET NULL")

def downgrade() -> None:
    op.drop_constraint("fk_payments_deposit_id_deposits", "payments", type_="foreignkey")
    op.drop_index(op.f("ix_payments_deposit_id"), table_name="payments")
    op.drop_column("payments", "deposit_id")
    op.drop_index(op.f("ix_deposits_user_id"), table_name="deposits")
    op.drop_index(op.f("ix_deposits_status"), table_name="deposits")
    op.drop_index(op.f("ix_deposits_account_id"), table_name="deposits")
    op.drop_table("deposits")
