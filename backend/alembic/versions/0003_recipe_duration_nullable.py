"""allow crawled recipes to retain an unknown source duration

Revision ID: 0003_recipe_duration_nullable
Revises: 0002_source_steps_grams
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_recipe_duration_nullable"
down_revision = "0002_source_steps_grams"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("recipes") as batch_op:
        batch_op.alter_column(
            "duration_minutes",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("recipes") as batch_op:
        batch_op.alter_column(
            "duration_minutes",
            existing_type=sa.Integer(),
            nullable=False,
        )
