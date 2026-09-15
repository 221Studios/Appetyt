export interface Ingredient {
  id: string;
  name: string;
  categoryDetail: string;
  amountBase: number;
  unit: string;
  inFridge: boolean;
  inPantry?: boolean;
  scalable: boolean;
  icon: string;
  estimatedPrice?: number;
  store?: string;
  sourceNote?: string;
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
  authorSlug?: string;
  imageUrl: string;
  imageAlt: string;
  durationMinutes: number;
  estimatedPrice: string;
  numericPrice: number;
  caloriesText: string;
  category: string;
  cuisine: string;
  verified: boolean;
  baseServings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
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
  price: number;
  storeName?: string;
  isBought: boolean;
  group: 'pappardelle' | 'szakszuka' | 'custom' | string;
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

export type TabType = 'odkrywaj' | 'szukaj' | 'lodowka' | 'zakupy' | 'zapisane';
