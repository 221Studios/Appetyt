"""add recipe discovery tags and daily editions

Revision ID: 0006_discovery_feed
Revises: 0005_auth
"""

import sqlalchemy as sa

from alembic import op

revision = "0006_discovery_feed"
down_revision = "0005_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recipe_tags",
        sa.Column("id", sa.String(length=120), primary_key=True),
        sa.Column("group", sa.String(length=40), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("group", "slug", name="uq_recipe_tags_group_slug"),
    )
    op.create_index("ix_recipe_tags_group", "recipe_tags", ["group"])
    op.create_table(
        "recipe_tag_assignments",
        sa.Column(
            "recipe_id",
            sa.String(length=120),
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            sa.String(length=120),
            sa.ForeignKey("recipe_tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    op.create_index("ix_recipe_tag_assignments_tag", "recipe_tag_assignments", ["tag_id"])
    op.create_table(
        "daily_discoveries",
        sa.Column("edition_date", sa.Date(), primary_key=True),
        sa.Column("rank", sa.Integer(), primary_key=True),
        sa.Column(
            "recipe_id",
            sa.String(length=120),
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.UniqueConstraint("edition_date", "recipe_id", name="uq_daily_discoveries_recipe"),
    )
    op.create_index("ix_daily_discoveries_recipe_id", "daily_discoveries", ["recipe_id"])


def downgrade() -> None:
    op.drop_index("ix_daily_discoveries_recipe_id", table_name="daily_discoveries")
    op.drop_table("daily_discoveries")
    op.drop_index("ix_recipe_tag_assignments_tag", table_name="recipe_tag_assignments")
    op.drop_table("recipe_tag_assignments")
    op.drop_index("ix_recipe_tags_group", table_name="recipe_tags")
    op.drop_table("recipe_tags")
