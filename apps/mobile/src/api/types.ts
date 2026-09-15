export type Nutrition = {
  calories: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
};

export type Creator = {
  id: string;
  name: string;
  category: string | null;
  primary_source: string;
  website_url: string | null;
  youtube_url: string | null;
  language: string;
  recipe_count: number;
};

export type RecipeSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  cuisine: string | null;
  creator: Creator | null;
  source_url: string;
  duration_minutes: number;
  servings: number;
  nutrition_per_serving: Nutrition;
  ingredient_count: number;
  ingredient_names: string[];
};

export type RecipeIngredient = {
  ingredient_id: number | null;
  name: string;
  amount_value: number | null;
  amount_text: string;
  unit: string | null;
  scalable: boolean;
  ingredient: {
    id: number;
    name: string;
    name_en: string;
    name_pl: string | null;
    nutrition_per_100g: Nutrition;
    source: string;
    source_updated_at: string | null;
  } | null;
};

export type RecipeStep = {
  step_number: number;
  title: string;
  instructions: string;
  duration_minutes: number | null;
};

export type StoreCost = {
  store: string;
  store_name: string;
  currency: string;
  is_estimate: boolean;
  usage_cost_pln: number;
  basket_cost_pln: number;
  lines: CostLine[];
  source_updated_at: string | null;
};

export type CostLine = {
  ingredient_name: string;
  required_amount: string;
  product: {
    name: string;
    price_pln: number;
    is_estimate: boolean;
    price_per_100g: number | null;
    price_per_100ml: number | null;
    package_qty: number;
    package_unit: string;
  } | null;
  usage_cost_pln: number | null;
  basket_cost_pln: number | null;
  confidence: string;
};

export type RecipeDetail = RecipeSummary & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  costs: StoreCost[];
};
