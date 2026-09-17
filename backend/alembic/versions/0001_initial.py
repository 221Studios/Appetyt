"""create Appetyt domain tables

Revision ID: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def product_table(name: str) -> None:
    op.create_table(
        name,
        sa.Column("id", sa.String(length=160), primary_key=True),
        sa.Column("ean", sa.String(length=32)),
        sa.Column("name", sa.String(length=300), nullable=False),
        sa.Column("brand", sa.String(length=160)),
        sa.Column("category", sa.String(length=160)),
        sa.Column("package_qty", sa.Float(), nullable=False),
        sa.Column("package_unit", sa.String(length=30), nullable=False),
        sa.Column("package_size_g", sa.Float()),
        sa.Column("price_pln", sa.Float(), nullable=False),
        sa.Column("price_per_100g", sa.Float()),
        sa.Column("source_url", sa.String(length=1000)),
        sa.Column("source_updated_at", sa.DateTime(timezone=True)),
        sa.Column("ingredient_id", sa.Integer()),
    )
    op.create_index(f"ix_{name}_ingredient", name, ["ingredient_id"])
    op.create_index(f"ix_{name}_name", name, ["name"])


def upgrade() -> None:
    op.create_table(
        "creators",
        sa.Column("id", sa.String(length=120), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=40)),
        sa.Column("primary_source", sa.String(length=40), nullable=False),
        sa.Column("website_url", sa.String(length=1000)),
        sa.Column("youtube_url", sa.String(length=1000)),
        sa.Column("language", sa.String(length=10), nullable=False),
    )
    op.create_index("ix_creators_name", "creators", ["name"])
    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name_en", sa.String(length=240), nullable=False),
        sa.Column("name_pl", sa.String(length=240)),
        sa.Column("kcal_per_100g", sa.Float()),
        sa.Column("protein_per_100g", sa.Float()),
        sa.Column("fat_per_100g", sa.Float()),
        sa.Column("carbs_per_100g", sa.Float()),
        sa.Column("source_release", sa.String(length=120), nullable=False),
        sa.Column("source_updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_ingredients_name_pl", "ingredients", ["name_pl"])
    op.create_index("ix_ingredients_name_en", "ingredients", ["name_en"])
    op.create_table(
        "recipes",
        sa.Column("id", sa.String(length=120), primary_key=True),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("subtitle", sa.String(length=240)),
        sa.Column("category", sa.String(length=120), nullable=False),
        sa.Column("cuisine", sa.String(length=120)),
        sa.Column("creator_id", sa.String(length=120), sa.ForeignKey("creators.id")),
        sa.Column("source_url", sa.String(length=1000), nullable=False),
        sa.Column("source_updated_at", sa.DateTime(timezone=True)),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("calories_per_serving", sa.Float()),
        sa.Column("protein_per_serving", sa.Float()),
        sa.Column("fat_per_serving", sa.Float()),
        sa.Column("carbs_per_serving", sa.Float()),
    )
    op.create_index("ix_recipes_category", "recipes", ["category"])
    op.create_index("ix_recipes_creator", "recipes", ["creator_id"])
    op.create_table(
        "recipe_ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.String(length=120), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ingredient_id", sa.Integer(), sa.ForeignKey("ingredients.id")),
        sa.Column("name", sa.String(length=240), nullable=False),
        sa.Column("amount_value", sa.Float()),
        sa.Column("amount_text", sa.String(length=120), nullable=False),
        sa.Column("unit", sa.String(length=30)),
        sa.Column("scalable", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False),
    )
    op.create_index("ix_recipe_ingredients_recipe", "recipe_ingredients", ["recipe_id"])
    op.create_index("ix_recipe_ingredients_ingredient", "recipe_ingredients", ["ingredient_id"])
    op.create_table(
        "recipe_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.String(length=120), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("duration_minutes", sa.Integer()),
    )
    op.create_index("ix_recipe_steps_recipe", "recipe_steps", ["recipe_id"])
    op.create_table(
        "store_catalogs",
        sa.Column("slug", sa.String(length=30), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("source_url", sa.String(length=1000)),
        sa.Column("source_updated_at", sa.DateTime(timezone=True)),
    )
    product_table("products_frisco")
    product_table("products_auchan")
    product_table("products_carrefour")


def downgrade() -> None:
    for name in ("products_carrefour", "products_auchan", "products_frisco", "store_catalogs", "recipe_steps", "recipe_ingredients", "recipes", "ingredients", "creators"):
        op.drop_table(name)
