from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


recipe_tag_assignments = Table(
    "recipe_tag_assignments",
    Base.metadata,
    Column("recipe_id", String(120), ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(120), ForeignKey("recipe_tags.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    google_subject: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    user: Mapped[User] = relationship(back_populates="sessions")


class OAuthState(Base):
    __tablename__ = "oauth_states"

    state_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    code_verifier: Mapped[str] = mapped_column(String(128), nullable=False)
    nonce: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)


class Creator(Base):
    __tablename__ = "creators"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(40))
    primary_source: Mapped[str] = mapped_column(String(40), nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(1000))
    youtube_url: Mapped[str | None] = mapped_column(String(1000))
    language: Mapped[str] = mapped_column(String(10), default="pl", nullable=False)
    recipes: Mapped[list["Recipe"]] = relationship(back_populates="creator")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name_en: Mapped[str] = mapped_column(String(240), nullable=False)
    name_pl: Mapped[str | None] = mapped_column(String(240))
    kcal_per_100g: Mapped[float | None] = mapped_column(Float)
    protein_per_100g: Mapped[float | None] = mapped_column(Float)
    fat_per_100g: Mapped[float | None] = mapped_column(Float)
    carbs_per_100g: Mapped[float | None] = mapped_column(Float)
    source_release: Mapped[str] = mapped_column(String(120), nullable=False)
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    recipe_lines: Mapped[list["RecipeIngredient"]] = relationship(back_populates="ingredient")


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(240))
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    cuisine: Mapped[str | None] = mapped_column(String(120))
    creator_id: Mapped[str | None] = mapped_column(ForeignKey("creators.id"))
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    servings: Mapped[int | None] = mapped_column(Integer)
    calories_per_serving: Mapped[float | None] = mapped_column(Float)
    protein_per_serving: Mapped[float | None] = mapped_column(Float)
    fat_per_serving: Mapped[float | None] = mapped_column(Float)
    carbs_per_serving: Mapped[float | None] = mapped_column(Float)
    source_steps_json: Mapped[str | None] = mapped_column(Text)
    creator: Mapped[Creator | None] = relationship(back_populates="recipes")
    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeIngredient.sort_order"
    )
    steps: Mapped[list["RecipeStep"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeStep.step_number"
    )
    tags: Mapped[list["RecipeTag"]] = relationship(
        secondary=recipe_tag_assignments, back_populates="recipes"
    )
    daily_discoveries: Mapped[list["DailyDiscovery"]] = relationship(back_populates="recipe")


class RecipeTag(Base):
    __tablename__ = "recipe_tags"
    __table_args__ = (UniqueConstraint("group", "slug", name="uq_recipe_tags_group_slug"),)

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    group: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    recipes: Mapped[list[Recipe]] = relationship(
        secondary=recipe_tag_assignments, back_populates="tags"
    )


class DailyDiscovery(Base):
    __tablename__ = "daily_discoveries"
    __table_args__ = (UniqueConstraint("edition_date", "recipe_id", name="uq_daily_discoveries_recipe"),)

    edition_date: Mapped[date] = mapped_column(Date, primary_key=True)
    rank: Mapped[int] = mapped_column(Integer, primary_key=True)
    recipe_id: Mapped[str] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipe: Mapped[Recipe] = relationship(back_populates="daily_discoveries")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recipe_id: Mapped[str] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id: Mapped[int | None] = mapped_column(ForeignKey("ingredients.id"))
    name: Mapped[str] = mapped_column(String(240), nullable=False)
    amount_value: Mapped[float | None] = mapped_column(Float)
    amount_text: Mapped[str] = mapped_column(String(120), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(30))
    amount_g: Mapped[float | None] = mapped_column(Float)
    scalable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    section_title: Mapped[str | None] = mapped_column(String(120))
    recipe: Mapped[Recipe] = relationship(back_populates="ingredients")
    ingredient: Mapped[Ingredient | None] = relationship(back_populates="recipe_lines")


class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recipe_id: Mapped[str] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    recipe: Mapped[Recipe] = relationship(back_populates="steps")


class StoreCatalog(Base):
    __tablename__ = "store_catalogs"

    slug: Mapped[str] = mapped_column(String(30), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000))
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ProductColumns:
    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    ean: Mapped[str | None] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(160))
    category: Mapped[str | None] = mapped_column(String(160))
    package_qty: Mapped[float] = mapped_column(Float, nullable=False)
    package_unit: Mapped[str] = mapped_column(String(30), nullable=False)
    package_size_g: Mapped[float | None] = mapped_column(Float)
    price_pln: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_100g: Mapped[float | None] = mapped_column(Float)
    source_url: Mapped[str | None] = mapped_column(String(1000))
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ingredient_id: Mapped[int | None] = mapped_column(Integer)


class FriscoProduct(ProductColumns, Base):
    __tablename__ = "products_frisco"


class AuchanProduct(ProductColumns, Base):
    __tablename__ = "products_auchan"


class CarrefourProduct(ProductColumns, Base):
    __tablename__ = "products_carrefour"


PRODUCT_MODELS = {
    "frisco": FriscoProduct,
    "auchan": AuchanProduct,
    "carrefour": CarrefourProduct,
}
STORE_NAMES = {"frisco": "Frisco", "auchan": "Auchan", "carrefour": "Carrefour"}
