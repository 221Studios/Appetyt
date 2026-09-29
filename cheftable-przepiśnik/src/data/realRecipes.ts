import {
  Chef,
  CookingStep,
  Ingredient,
  IngredientNutrition,
  Recipe,
  RecipeStoreCost,
  StepIngredient,
} from '../types';
import {
  getRecipeTranslation,
  RecipeLanguage,
  sourceRecipeText,
} from './recipeTranslation';

type RawIngredient = {
  ingredient_id?: number | null;
  name?: string;
  name_pl?: string | null;
  amount_value?: number | null;
  amount_text?: string | null;
  unit?: string | null;
  amount_g?: number | null;
  scalable?: boolean;
  nutrition?: {
    kcal_per_100g?: number | null;
    protein_per_100g?: number | null;
    fat_per_100g?: number | null;
    carbs_per_100g?: number | null;
    source?: string | null;
  };
};

type RawStep = {
  step_number?: number;
  title?: string;
  instructions?: string;
  duration_minutes?: number | null;
};

type RawRecipe = {
  id: string;
  title: string;
  title_pl?: string | null;
  subtitle_pl?: string | null;
  category_pl?: string | null;
  cuisine_pl?: string | null;
  ingredients_pl?: string[] | null;
  steps_pl?: string[] | null;
  title_en?: string | null;
  subtitle_en?: string | null;
  category_en?: string | null;
  cuisine_en?: string | null;
  ingredients_en?: string[] | null;
  steps_en?: string[] | null;
  translations?: Partial<Record<RecipeLanguage, {
    title?: string | null;
    subtitle?: string | null;
    category?: string | null;
    cuisine?: string | null;
    ingredients?: string[] | null;
    steps?: string[] | null;
  }>> | null;
  subtitle?: string | null;
  category?: string | null;
  cuisine?: string | null;
  creator_id: string;
  source_url: string;
  /** Własna, zoptymalizowana kopia obrazu spakowana z aplikacją. */
  image_url?: string | null;
  duration_minutes?: number | null;
  servings?: number | null;
  calories_per_serving?: number | null;
  protein_per_serving?: number | null;
  fat_per_serving?: number | null;
  carbs_per_serving?: number | null;
  /** MVP: string[] 1:1; legacy: obiekty. */
  ingredients?: Array<string | RawIngredient>;
  /** MVP: string[]; legacy: obiekty. */
  steps?: Array<string | RawStep>;
  source_steps?: string[];
  costs?: Array<{
    store: string;
    store_name: string;
    currency: string;
    usage_cost_pln: number;
    basket_cost_pln: number;
    source_updated_at?: string | null;
    lines: Array<{
      ingredient_name: string;
      required_amount: string;
      usage_cost_pln?: number | null;
      basket_cost_pln?: number | null;
      confidence: string;
      product?: {
        id: string;
        name: string;
        brand?: string | null;
        package_qty: number;
        package_unit: string;
        price_pln: number;
        price_per_100g?: number | null;
        price_per_100ml?: number | null;
        source_url?: string | null;
      } | null;
    }>;
  }>;
};

type CreatorMeta = {
  name: string;
  shortName: string;
  sourceUrl: string;
  domain: string;
  initials: string;
  colors: [string, string];
  avatarUrl: string;
};

const CREATOR_META: Record<string, CreatorMeta> = {
  foxx_gotuje: {
    name: 'Foxx Gotuje',
    shortName: 'Foxx Gotuje',
    sourceUrl: 'https://adifoxx.pl/blog/',
    domain: 'adifoxx.pl',
    initials: 'FG',
    colors: ['#fe932c', '#f05b36'],
    avatarUrl: 'https://adifoxx.pl/wp-content/uploads/2022/11/adi-1.jpg',
  },
  sam_the_cooking_guy: {
    name: 'Sam The Cooking Guy',
    shortName: 'Sam',
    sourceUrl: 'https://thecookingguy.com',
    domain: 'thecookingguy.com',
    initials: 'ST',
    colors: ['#168c68', '#0b4d42'],
    avatarUrl: 'https://luxe-beat-mag.s3-accelerate.amazonaws.com/wp-content/uploads/2016/10/sam-the-cooking-guy.jpg',
  },
  nick_digiovanni: {
    name: 'Nick DiGiovanni',
    shortName: 'Nick',
    sourceUrl: 'https://nickskitchen.com/recipes',
    domain: 'nickskitchen.com',
    initials: 'ND',
    colors: ['#6956d8', '#312a75'],
    avatarUrl: 'https://nickskitchen.com/wp-content/uploads/2025/04/image-1-e1745974925462-edited-1.png',
  },
  joshua_weissman: {
    name: 'Joshua Weissman',
    shortName: 'Joshua',
    sourceUrl: 'https://www.joshuaweissman.com/recipes',
    domain: 'joshuaweissman.com',
    initials: 'JW',
    colors: ['#dc5366', '#721f39'],
    avatarUrl: 'https://cdn.prod.website-files.com/6744d2d124649f6ecd466ed9/6892a800504f7314a4537077_Copy%20of%20JW-10-p-500.jpg',
  },
};

const FALLBACK_CREATOR: CreatorMeta = {
  name: 'Appetyt',
  shortName: 'Appetyt',
  sourceUrl: 'https://www.przepisnik.eu/',
  domain: 'przepisnik.eu',
  initials: 'CT',
  colors: ['#fe932c', '#6e3900'],
  avatarUrl: '',
};

const CATALOG_LABELS: Record<RecipeLanguage, { ingredient: string; recipe: string; recipes: string; taste: string; step: string; fallbackStep: string }> = {
  pl: {
    ingredient: 'Składnik',
    recipe: 'Przepis',
    recipes: 'Przepisy',
    taste: 'do smaku',
    step: 'Krok',
    fallbackStep: 'Wykonaj etap zgodnie z przepisem.',
  },
  en: {
    ingredient: 'Ingredient',
    recipe: 'Recipe',
    recipes: 'Recipes',
    taste: 'to taste',
    step: 'Step',
    fallbackStep: 'Follow the recipe for this step.',
  },
};

function imageDataUrl(label: string, colors: [string, string], wide = true) {
  const safeLabel = label.replace(/[<>&"']/g, '').slice(0, 3);
  const width = wide ? 960 : 160;
  const height = wide ? 600 : 160;
  const fontSize = wide ? Math.round(height * 0.28) : Math.round(height * 0.38);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${colors[0]}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function numeric(value: number | null | undefined, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function ingredientIcon(unit: string) {
  if (unit.includes('łyż') || unit.includes('szt')) return 'restaurant';
  if (unit.includes('ml') || unit.includes('cup')) return 'water_drop';
  return 'grain';
}

function mapIngredient(raw: RawIngredient, index: number, translatedLine: string | undefined, language: RecipeLanguage): Ingredient {
  const amount = raw.amount_value ?? null;
  const grams = raw.amount_g ?? null;
  const amountBase = amount !== null ? numeric(amount) : grams !== null ? numeric(grams) : 0;
  const unit = raw.unit?.trim() || (grams !== null ? 'g' : CATALOG_LABELS[language].taste);
  const sourceName = raw.name?.trim() || CATALOG_LABELS[language].ingredient;
  const name = translatedLine?.trim() || raw.name_pl?.trim() || sourceName;
  const amountText = translatedLine?.trim() || raw.amount_text?.trim() || name;
  const nutrition: IngredientNutrition | undefined = raw.nutrition
    ? {
        kcalPer100g: raw.nutrition.kcal_per_100g ?? null,
        proteinPer100g: raw.nutrition.protein_per_100g ?? null,
        fatPer100g: raw.nutrition.fat_per_100g ?? null,
        carbsPer100g: raw.nutrition.carbs_per_100g ?? null,
        source: raw.nutrition.source,
      }
    : undefined;

  return {
    id: `ingredient-${index}-${name}`,
    name,
    polishName: raw.name_pl?.trim() || undefined,
    categoryDetail: amountText,
    amountText,
    amountBase,
    unit,
    inFridge: false,
    inPantry: false,
    scalable: Boolean(raw.scalable) && amountBase > 0,
    icon: ingredientIcon(unit),
    nutrition,
  };
}

const STEP_INGREDIENT_STOP_WORDS = new Set([
  'about', 'added', 'and', 'as', 'at', 'for', 'from', 'into', 'more', 'optional',
  'over', 'plus', 'room', 'some', 'taste', 'the', 'then', 'this', 'to', 'with',
  'your', 'or', 'oraz', 'do', 'na', 'po', 'w', 'we', 'z', 'ze', 'i', 'lub', 'do',
  'smaku', 'świeży', 'świeża', 'świeże', 'posiekany', 'posiekana', 'posiekane',
  'pokrojony', 'pokrojona', 'pokrojone', 'drobno', 'duży', 'duża', 'duże',
]);

function normalizedWords(value: string) {
  return value
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isIngredientUsedInStep(stepText: string, ingredient: Ingredient) {
  const stepWords = normalizedWords(stepText);
  const candidateWords = [ingredient.name, ingredient.polishName || '']
    .flatMap(normalizedWords)
    .filter((word) => word.length >= 4 && !STEP_INGREDIENT_STOP_WORDS.has(word));
  const stems = [...new Set(candidateWords.map((word) => (word.length > 5 ? word.slice(0, 5) : word)))];
  return stems.some((stem) =>
    stepWords.some((word) => word === stem || word.startsWith(stem) || stem.startsWith(word))
  );
}

function stepIngredientFromRecipeIngredient(ingredient: Ingredient): StepIngredient {
  const amount = ingredient.amountText && /[\d¼½¾]/.test(ingredient.amountText)
    ? ingredient.amountText
    : undefined;
  return {
    name: ingredient.polishName || ingredient.name,
    amount,
    amountBase: ingredient.amountBase || undefined,
    unit: ingredient.unit,
    scalable: ingredient.scalable,
    icon: ingredient.icon,
  };
}

function mapStep(raw: RawStep, index: number, language: RecipeLanguage): CookingStep {
  const description = raw.instructions?.trim() || raw.title?.trim() || CATALOG_LABELS[language].fallbackStep;
  const title = raw.title?.trim() || `${CATALOG_LABELS[language].step} ${index + 1}`;
  const stepIngredients: StepIngredient[] = [];
  return {
    stepNumber: raw.step_number || index + 1,
    title,
    description,
    durationMinutes: raw.duration_minutes ?? undefined,
    stepIngredients,
  };
}

const creatorImageCache = new Map<string, string>();

function creatorImageUrl(creator: CreatorMeta, wide = true) {
  const key = `${creator.initials}:${wide ? 'w' : 's'}`;
  const cached = creatorImageCache.get(key);
  if (cached) return cached;
  const url = imageDataUrl(creator.initials, creator.colors, wide);
  creatorImageCache.set(key, url);
  return url;
}

function creatorAvatarUrl(creator: CreatorMeta) {
  return creator.avatarUrl || creatorImageUrl(creator, false);
}

function mapIngredientLine(
  raw: string | RawIngredient,
  index: number,
  translatedLine: string | undefined,
  language: RecipeLanguage,
): Ingredient {
  if (typeof raw === 'string') {
    const name = translatedLine?.trim() || raw.trim() || CATALOG_LABELS[language].ingredient;
    return {
      id: `ingredient-${index}`,
      name,
      categoryDetail: name,
      amountText: name,
      amountBase: 0,
      unit: '',
      inFridge: false,
      inPantry: false,
      scalable: false,
      icon: 'restaurant',
    };
  }
  return mapIngredient(raw, index, translatedLine, language);
}

function mapStepLine(
  raw: string | RawStep,
  index: number,
  translatedText: string | undefined,
  language: RecipeLanguage,
): CookingStep {
  if (typeof raw === 'string') {
    const description = translatedText?.trim() || raw.trim() || '—';
    return {
      stepNumber: index + 1,
      title: `${CATALOG_LABELS[language].step} ${index + 1}`,
      description,
      stepIngredients: [],
    };
  }
  const step = mapStep(raw, index, language);
  return translatedText?.trim() ? { ...step, description: translatedText.trim() } : step;
}

function mapRecipe(raw: RawRecipe, language: RecipeLanguage): Recipe {
  const creator = CREATOR_META[raw.creator_id] || FALLBACK_CREATOR;
  const source = sourceRecipeText(raw);
  const translation = getRecipeTranslation(raw, language);
  const localized = translation || source;
  const ingredients = (raw.ingredients || []).map((ingredient, index) =>
    mapIngredientLine(ingredient, index, localized.ingredients[index], language),
  );
  const steps = (raw.steps || []).map((step, index) =>
    mapStepLine(step, index, localized.steps[index], language),
  );
  const calories = raw.calories_per_serving;

  return {
    id: raw.id,
    title: localized.title,
    subtitle: localized.subtitle || undefined,
    categoryLabel: localized.category || CATALOG_LABELS[language].recipe,
    author: creator.name,
    authorAvatar: creator.initials,
    authorSourceUrl: creator.sourceUrl,
    sourceUrl: raw.source_url,
    authorSlug: raw.creator_id,
    imageUrl: raw.image_url?.trim() || creatorImageUrl(creator, true),
    imageAlt: localized.title,
    durationMinutes: raw.duration_minutes ?? null,
    estimatedPrice: '',
    numericPrice: 0,
    caloriesText: calories === null || calories === undefined ? '' : `${numeric(calories)} kcal`,
    caloriesPerServing: calories,
    proteinPerServing: raw.protein_per_serving,
    fatPerServing: raw.fat_per_serving,
    carbsPerServing: raw.carbs_per_serving,
    category: localized.category || CATALOG_LABELS[language].recipes,
    cuisine: localized.cuisine || '',
    verified: true,
    baseServings: raw.servings ?? null,
    ingredients,
    steps,
    sourceSteps: [],
    storeCosts: [],
  };
}

function mapChef(creatorId: string, recipes: Recipe[]): Chef {
  const creator = CREATOR_META[creatorId] || FALLBACK_CREATOR;
  return {
    id: creatorId,
    name: creator.name,
    slug: creatorId,
    shortName: creator.shortName,
    recipesCount: recipes.length,
    sourceDomain: creator.domain,
    avatarUrl: creatorAvatarUrl(creator),
    isVerified: true,
    isFollowing: false,
  };
}

let rawCatalogPromise: Promise<RawRecipe[]> | null = null;
let rawCatalogIndexPromise: Promise<RawRecipe[]> | null = null;

async function fetchRawCatalog(path: string): Promise<RawRecipe[]> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać katalogu przepisów (${response.status})`);
  }
  return (await response.json()) as RawRecipe[];
}

async function loadRawRecipeCatalog(): Promise<RawRecipe[]> {
  if (!rawCatalogPromise) rawCatalogPromise = fetchRawCatalog('/recipes.json');
  return rawCatalogPromise;
}

async function loadRawRecipeIndex(): Promise<RawRecipe[]> {
  if (!rawCatalogIndexPromise) rawCatalogIndexPromise = fetchRawCatalog('/recipes-index.json');
  return rawCatalogIndexPromise;
}

function mapRecipeCatalog(rawRecipes: RawRecipe[], language: RecipeLanguage) {
  const recipes = rawRecipes
    .filter((recipe) => CREATOR_META[recipe.creator_id])
    .map((recipe) => mapRecipe(recipe, language));
  const orderedCreators = ['foxx_gotuje', 'sam_the_cooking_guy', 'nick_digiovanni', 'joshua_weissman'];
  const recipesByCreator = new Map<string, Recipe[]>();
  for (const recipe of recipes) {
    const list = recipesByCreator.get(recipe.authorSlug) || [];
    list.push(recipe);
    recipesByCreator.set(recipe.authorSlug, list);
  }
  const chefs = orderedCreators
    .map((creatorId) => mapChef(creatorId, recipesByCreator.get(creatorId) || []))
    .filter((chef) => chef.recipesCount > 0);
  return {recipes, chefs};
}

export async function loadRecipeCatalog(language: RecipeLanguage = 'pl') {
  const rawRecipes = await loadRawRecipeIndex();
  return mapRecipeCatalog(rawRecipes, language);
}

export async function loadRecipeDetails(
  recipeId: string,
  language: RecipeLanguage = 'pl',
): Promise<Recipe> {
  const rawRecipes = await loadRawRecipeCatalog();
  const rawRecipe = rawRecipes.find((recipe) => recipe.id === recipeId);
  if (!rawRecipe) throw new Error(`Nie znaleziono przepisu ${recipeId}`);
  return mapRecipe(rawRecipe, language);
}
