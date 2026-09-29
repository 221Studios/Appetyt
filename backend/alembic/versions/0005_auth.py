"""add minimal Google accounts and revocable sessions

Revision ID: 0005_auth
Revises: 0004_recipe_servings_nullable
"""

from alembic import op
import sqlalchemy as sa

revision = "0005_auth"
down_revision = "0004_recipe_servings_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("google_subject", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("google_subject", name="uq_users_google_subject"),
    )
    op.create_index("ix_users_google_subject", "users", ["google_subject"], unique=True)

    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("token_hash", name="uq_user_sessions_token_hash"),
    )
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("ix_user_sessions_token_hash", "user_sessions", ["token_hash"], unique=True)

    op.create_table(
        "oauth_states",
        sa.Column("state_hash", sa.String(length=64), primary_key=True),
        sa.Column("code_verifier", sa.String(length=128), nullable=False),
        sa.Column("nonce", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_oauth_states_expires_at", "oauth_states", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_oauth_states_expires_at", table_name="oauth_states")
    op.drop_table("oauth_states")
    op.drop_index("ix_user_sessions_token_hash", table_name="user_sessions")
    op.drop_index("ix_user_sessions_user_id", table_name="user_sessions")
    op.drop_table("user_sessions")
    op.drop_index("ix_users_google_subject", table_name="users")
    op.drop_table("users")
