from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AuthStatusOut(BaseModel):
    authenticated: bool
    is_admin: bool = False


class RecipeSubmissionCreateIn(BaseModel):
    url: str = Field(min_length=1, max_length=1000)


class RecipeSubmissionApproveIn(BaseModel):
    title: str | None = Field(default=None, max_length=240)
    author_name: str | None = Field(default=None, max_length=240)
    image_url: str | None = Field(default=None, max_length=1000)
    admin_note: str | None = Field(default=None, max_length=2000)


class RecipeSubmissionRejectIn(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)


class RecipeSubmissionAttemptOut(BaseModel):
    attempt_number: int
    created_at: datetime
    final_url: str | None
    http_status: int | None
    content_type: str | None
    extracted_title: str | None
    extracted_author: str | None
    source_image_url: str | None
    provenance: dict[str, str]
    recipe_signals: dict[str, bool]
    content_flags: list[str]
    recipe_confidence: float | None
    parser_version: str | None
    error_code: str | None
    error_detail: str | None


class RecipeSubmissionOut(BaseModel):
    id: str
    status: str
    submitted_url: str
    created_at: datetime
    updated_at: datetime
    reviewed_at: datetime | None
    rejection_reason: str | None
    published_recipe_id: str | None
    latest_attempt: RecipeSubmissionAttemptOut | None = None


class AdminRecipeSubmissionOut(RecipeSubmissionOut):
    submitted_by_user_id: str | None
    final_url: str | None
    extracted_title: str | None
    extracted_author: str | None
    source_image_url: str | None
    recipe_confidence: float | None
    content_flags: list[str]
    title_override: str | None
    author_override: str | None
    image_override_url: str | None
    admin_note: str | None


class MobileAuthExchangeIn(BaseModel):
    code: str = Field(min_length=16, max_length=256)


class RecipeRatingOut(BaseModel):
    recipe_id: str
    average_score: float | None
    rating_count: int
    distribution: dict[str, int]
    viewer_score: int | None


class RecipeRatingIn(BaseModel):
    score: int = Field(ge=1, le=10)


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
    amount_g: float | None = None
    scalable: bool
    section_title: str | None = None
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
    duration_minutes: int | None
    servings: int | None
    nutrition_per_serving: NutritionOut
    ingredient_count: int
    ingredient_names: list[str]
    source_kind: str = "curated"
    source_author_name: str | None = None
    cover_image_url: str | None = None
    is_external_link: bool = False


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
    section_title: str | None = None
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
    source_steps: list[str] = Field(default_factory=list)
    costs: list[StoreCostOut] = Field(default_factory=list)


class RecipeListOut(BaseModel):
    items: list[RecipeSummaryOut]
    total: int
    limit: int
    offset: int


class DiscoverSectionOut(BaseModel):
    id: str
    title: str
    items: list[RecipeSummaryOut]


class DiscoverHomeOut(BaseModel):
    edition_date: date
    timezone: str
    next_refresh_at: datetime
    top5: list[RecipeSummaryOut]
    sections: list[DiscoverSectionOut]


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
