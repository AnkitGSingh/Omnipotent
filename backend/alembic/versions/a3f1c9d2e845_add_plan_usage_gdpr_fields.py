"""add plan usage gdpr fields

Revision ID: a3f1c9d2e845
Revises: 57ba8712c07d
Create Date: 2025-01-15 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a3f1c9d2e845"
down_revision = "57ba8712c07d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email column (nullable first to avoid constraint issues on existing rows)
    op.add_column("users", sa.Column("email", sa.String(), nullable=True))
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Add plan + usage tracking columns
    op.add_column(
        "users",
        sa.Column("plan", sa.String(), nullable=False, server_default="FREE"),
    )
    op.add_column(
        "users",
        sa.Column("monthly_tokens", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("tokens_reset_at", sa.DateTime(timezone=True), nullable=True),
    )

    # GDPR consent fields
    op.add_column(
        "users",
        sa.Column(
            "gdpr_consent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("FALSE"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("gdpr_consent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "gdpr_consent_at")
    op.drop_column("users", "gdpr_consent")
    op.drop_column("users", "tokens_reset_at")
    op.drop_column("users", "monthly_tokens")
    op.drop_column("users", "plan")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "email")
