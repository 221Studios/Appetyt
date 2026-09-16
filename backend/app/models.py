from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


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
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    servings: Mapped[int] = mapped_column(Integer, nullable=False)
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
