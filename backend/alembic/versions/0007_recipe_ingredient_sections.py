"""preserve ingredient sections for recipes and shopping lists

Revision ID: 0007_recipe_ingredient_sections
Revises: 0006_discovery_feed
"""

import sqlalchemy as sa

from alembic import op

revision = "0007_recipe_ingredient_sections"
down_revision = "0006_discovery_feed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "recipe_ingredients",
        sa.Column("section_title", sa.String(length=120), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("recipe_ingredients", "section_title")
