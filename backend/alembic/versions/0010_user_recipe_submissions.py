"""add moderated user recipe-link submissions

Revision ID: 0010_user_recipe_submissions
Revises: 0009_recipe_ratings
"""

import sqlalchemy as sa

from alembic import op

revision = "0010_user_recipe_submissions"
down_revision = "0009_recipe_ratings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "recipes",
        sa.Column("source_kind", sa.String(length=40), nullable=False, server_default="curated"),
    )
    op.add_column("recipes", sa.Column("source_author_name", sa.String(length=240), nullable=True))
    op.add_column("recipes", sa.Column("cover_image_url", sa.String(length=1000), nullable=True))

    op.create_table(
        "recipe_submissions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("submitted_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("submitted_url", sa.String(length=1000), nullable=False),
        sa.Column("normalized_url", sa.String(length=1000), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("published_recipe_id", sa.String(length=120), nullable=True),
        sa.Column("final_url", sa.String(length=1000), nullable=True),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("content_type", sa.String(length=160), nullable=True),
        sa.Column("extracted_title", sa.String(length=240), nullable=True),
        sa.Column("extracted_author", sa.String(length=240), nullable=True),
        sa.Column("source_image_url", sa.String(length=1000), nullable=True),
        sa.Column("provenance_json", sa.Text(), nullable=True),
        sa.Column("recipe_signals_json", sa.Text(), nullable=True),
        sa.Column("content_flags_json", sa.Text(), nullable=True),
        sa.Column("recipe_confidence", sa.Float(), nullable=True),
        sa.Column("parser_version", sa.String(length=80), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("title_override", sa.String(length=240), nullable=True),
        sa.Column("author_override", sa.String(length=240), nullable=True),
        sa.Column("image_override_url", sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["published_recipe_id"], ["recipes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("published_recipe_id", name="uq_recipe_submissions_published_recipe"),
    )
    op.create_index("ix_recipe_submissions_submitted_by_user_id", "recipe_submissions", ["submitted_by_user_id"])
    op.create_index("ix_recipe_submissions_normalized_url", "recipe_submissions", ["normalized_url"])
    op.create_index("ix_recipe_submissions_status", "recipe_submissions", ["status"])
    op.create_index("ix_recipe_submissions_reviewed_by_user_id", "recipe_submissions", ["reviewed_by_user_id"])

    op.create_table(
        "recipe_submission_attempts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("submission_id", sa.String(length=36), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("final_url", sa.String(length=1000), nullable=True),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("content_type", sa.String(length=160), nullable=True),
        sa.Column("extracted_title", sa.String(length=240), nullable=True),
        sa.Column("extracted_author", sa.String(length=240), nullable=True),
        sa.Column("source_image_url", sa.String(length=1000), nullable=True),
        sa.Column("provenance_json", sa.Text(), nullable=True),
        sa.Column("recipe_signals_json", sa.Text(), nullable=True),
        sa.Column("content_flags_json", sa.Text(), nullable=True),
        sa.Column("recipe_confidence", sa.Float(), nullable=True),
        sa.Column("parser_version", sa.String(length=80), nullable=True),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["submission_id"], ["recipe_submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("submission_id", "attempt_number", name="uq_recipe_submission_attempt"),
    )
    op.create_index("ix_recipe_submission_attempts_submission_id", "recipe_submission_attempts", ["submission_id"])


def downgrade() -> None:
    op.drop_index("ix_recipe_submission_attempts_submission_id", table_name="recipe_submission_attempts")
    op.drop_table("recipe_submission_attempts")
    op.drop_index("ix_recipe_submissions_reviewed_by_user_id", table_name="recipe_submissions")
    op.drop_index("ix_recipe_submissions_status", table_name="recipe_submissions")
    op.drop_index("ix_recipe_submissions_normalized_url", table_name="recipe_submissions")
    op.drop_index("ix_recipe_submissions_submitted_by_user_id", table_name="recipe_submissions")
    op.drop_table("recipe_submissions")
    op.drop_column("recipes", "cover_image_url")
    op.drop_column("recipes", "source_author_name")
    op.drop_column("recipes", "source_kind")
    op.drop_column("users", "is_admin")
