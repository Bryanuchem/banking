"""add background job run history

Revision ID: 3b7d9e5f1a20
Revises: 2a6c8d4e9f10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "3b7d9e5f1a20"
down_revision = "2a6c8d4e9f10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_runs",
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "job_name",
            sa.String(length=80),
            nullable=False,
        ),
        sa.Column(
            "trigger",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "items_processed",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "items_failed",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "details",
            postgresql.JSONB(
                astext_type=sa.Text()
            ),
            nullable=True,
        ),
        sa.Column(
            "actor_user_id",
            sa.UUID(),
            nullable=True,
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "finished_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_job_runs_job_name",
        "job_runs",
        ["job_name"],
        unique=False,
    )
    op.create_index(
        "ix_job_runs_status",
        "job_runs",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_job_runs_actor_user_id",
        "job_runs",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_job_runs_started_at",
        "job_runs",
        ["started_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_job_runs_started_at",
        table_name="job_runs",
    )
    op.drop_index(
        "ix_job_runs_actor_user_id",
        table_name="job_runs",
    )
    op.drop_index(
        "ix_job_runs_status",
        table_name="job_runs",
    )
    op.drop_index(
        "ix_job_runs_job_name",
        table_name="job_runs",
    )
    op.drop_table("job_runs")
