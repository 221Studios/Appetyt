export interface Ingredient {
  id: string;
  name: string;
  polishName?: string;
  categoryDetail: string;
  amountText?: string;
  amountBase: number;
  unit: string;
  inFridge: boolean;
  inPantry?: boolean;
  scalable: boolean;
  icon: string;
  estimatedPrice?: number;
  store?: string;
  sourceNote?: string;
  nutrition?: IngredientNutrition;
}

export interface IngredientNutrition {
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  source?: string | null;
}

export interface RecipeProduct {
  id: string;
  name: string;
  brand?: string | null;
  packageQty: number;
  packageUnit: string;
  pricePln: number;
  pricePer100g?: number | null;
  pricePer100ml?: number | null;
  sourceUrl?: string | null;
}

export interface RecipeCostLine {
  ingredientName: string;
  requiredAmount: string;
  product?: RecipeProduct | null;
  usageCostPln?: number | null;
  basketCostPln?: number | null;
  confidence: string;
}

export interface RecipeStoreCost {
  store: string;
  storeName: string;
  currency: string;
  usageCostPln: number;
  basketCostPln: number;
  lines: RecipeCostLine[];
  sourceUpdatedAt?: string | null;
}

export interface StepIngredient {
  name: string;
  amount?: string;
  amountBase?: number;
  unit?: string;
  scalable?: boolean;
  icon?: string;
}

export interface CookingStep {
  stepNumber: number;
  title: string;
  description: string;
  durationMinutes?: number;
  stepIngredients?: StepIngredient[];
}

export interface Recipe {
  id: string;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  author: string;
  authorAvatar?: string;
  authorSourceUrl?: string;
  sourceUrl?: string;
  authorSlug?: string;
  imageUrl: string;
  imageAlt: string;
  durationMinutes: number | null;
  estimatedPrice: string;
  numericPrice: number;
  caloriesText: string;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  fatPerServing?: number | null;
  carbsPerServing?: number | null;
  category: string;
  cuisine: string;
  verified: boolean;
  baseServings: number | null;
  ingredients: Ingredient[];
  steps: CookingStep[];
  sourceSteps?: string[];
  storeCosts?: RecipeStoreCost[];
  costBreakdown?: {
    totalEstimate: string;
    catalogAvg: string;
    userWithCards: string;
    toBuyNow: string;
    items: { name: string; price: string; highlight?: boolean }[];
  };
}

export interface ShoppingItem {
  id: string;
  title: string;
  subtitle: string;
  recipeId?: string;
  price: number;
  storeName?: string;
  isBought: boolean;
  group: 'custom' | string;
  groupTitle: string;
  groupIcon: string;
  isManualPrice?: boolean;
}

export interface Chef {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  recipesCount: number;
  sourceDomain: string;
  avatarUrl: string;
  isVerified: boolean;
  isFollowing?: boolean;
}

export type TabType = 'odkrywaj' | 'szukaj' | 'zakupy' | 'zapisane';
