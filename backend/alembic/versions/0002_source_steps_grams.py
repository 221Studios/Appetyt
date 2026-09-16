"""add source steps and estimated grams

Revision ID: 0002_source_steps_grams
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_source_steps_grams"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("recipes", sa.Column("source_steps_json", sa.Text(), nullable=True))
    op.add_column("recipe_ingredients", sa.Column("amount_g", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("recipe_ingredients", "amount_g")
    op.drop_column("recipes", "source_steps_json")
