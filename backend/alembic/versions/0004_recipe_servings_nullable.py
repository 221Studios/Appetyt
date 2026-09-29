"""allow crawled recipes to retain unknown source servings

Revision ID: 0004_recipe_servings_nullable
Revises: 0003_recipe_duration_nullable
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_recipe_servings_nullable"
down_revision = "0003_recipe_duration_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("recipes") as batch_op:
        batch_op.alter_column(
            "servings",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("recipes") as batch_op:
        batch_op.alter_column(
            "servings",
            existing_type=sa.Integer(),
            nullable=False,
        )
