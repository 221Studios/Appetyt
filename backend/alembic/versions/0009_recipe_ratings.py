"""add public recipe ratings linked to minimal user accounts

Revision ID: 0009_recipe_ratings
Revises: 0008_mobile_auth_handoff
"""

import sqlalchemy as sa

from alembic import op

revision = "0009_recipe_ratings"
down_revision = "0008_mobile_auth_handoff"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recipe_ratings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("recipe_id", sa.String(length=120), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "recipe_id", name="uq_recipe_ratings_user_recipe"),
    )
    op.create_index("ix_recipe_ratings_recipe_id", "recipe_ratings", ["recipe_id"])
    op.create_index("ix_recipe_ratings_user_id", "recipe_ratings", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_recipe_ratings_user_id", table_name="recipe_ratings")
    op.drop_index("ix_recipe_ratings_recipe_id", table_name="recipe_ratings")
    op.drop_table("recipe_ratings")
