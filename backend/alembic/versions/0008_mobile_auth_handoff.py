"""support OAuth handoff from a system browser back into the mobile app

Revision ID: 0008_mobile_auth_handoff
Revises: 0007_recipe_ingredient_sections
"""

import sqlalchemy as sa

from alembic import op

revision = "0008_mobile_auth_handoff"
down_revision = "0007_recipe_ingredient_sections"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "oauth_states",
        sa.Column("is_mobile", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_table(
        "mobile_auth_handoffs",
        sa.Column("code_hash", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_mobile_auth_handoffs_user_id", "mobile_auth_handoffs", ["user_id"])
    op.create_index("ix_mobile_auth_handoffs_expires_at", "mobile_auth_handoffs", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_mobile_auth_handoffs_expires_at", table_name="mobile_auth_handoffs")
    op.drop_index("ix_mobile_auth_handoffs_user_id", table_name="mobile_auth_handoffs")
    op.drop_table("mobile_auth_handoffs")
    op.drop_column("oauth_states", "is_mobile")
