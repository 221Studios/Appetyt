from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NutritionOut(BaseModel):
    calories: float | None
    protein_g: float | None
    fat_g: float | None
    carbs_g: float | None


class IngredientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    name_en: str
    name_pl: str | None
    nutrition_per_100g: NutritionOut
    source: str
    source_updated_at: datetime | None


class RecipeIngredientOut(BaseModel):
    ingredient_id: int | None
    name: str
    amount_value: float | None
    amount_text: str
    unit: str | None
    scalable: bool
    ingredient: IngredientOut | None = None


class RecipeStepOut(BaseModel):
    step_number: int
    title: str
    instructions: str
    duration_minutes: int | None


class CreatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str | None
    primary_source: str
    website_url: str | None
    youtube_url: str | None
    language: str
    recipe_count: int = 0


class RecipeSummaryOut(BaseModel):
    id: str
    title: str
    subtitle: str | None
    category: str
    cuisine: str | None
    creator: CreatorOut | None
    source_url: str
    duration_minutes: int
    servings: int
    nutrition_per_serving: NutritionOut
    ingredient_count: int
    ingredient_names: list[str]


class ProductOut(BaseModel):
    id: str
    store: str
    name: str
    brand: str | None
    package_qty: float
    package_unit: str
    price_pln: float
    is_estimate: bool = True
    price_per_100g: float | None
    price_per_100ml: float | None
    source_url: str | None
    source_updated_at: datetime | None


class CostLineOut(BaseModel):
    ingredient_name: str
    required_amount: str
    product: ProductOut | None
    usage_cost_pln: float | None
    basket_cost_pln: float | None
    confidence: str


class StoreCostOut(BaseModel):
    store: str
    store_name: str
    currency: str = "PLN"
    is_estimate: bool = True
    usage_cost_pln: float
    basket_cost_pln: float
    lines: list[CostLineOut]
    source_updated_at: datetime | None


class RecipeDetailOut(RecipeSummaryOut):
    ingredients: list[RecipeIngredientOut]
    steps: list[RecipeStepOut]
    costs: list[StoreCostOut] = Field(default_factory=list)


class RecipeListOut(BaseModel):
    items: list[RecipeSummaryOut]
    total: int
    limit: int
    offset: int


class IngredientSearchOut(BaseModel):
    items: list[IngredientOut]
    total: int


class StoreOut(BaseModel):
    slug: str
    name: str
    source_url: str | None
    source_updated_at: datetime | None
    product_count: int


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    store: str
