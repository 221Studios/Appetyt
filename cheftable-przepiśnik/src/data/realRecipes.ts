import {
  Chef,
  CookingStep,
  Ingredient,
  IngredientNutrition,
  Recipe,
  RecipeStoreCost,
  StepIngredient,
} from '../types';

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
  subtitle?: string | null;
  category?: string | null;
  cuisine?: string | null;
  creator_id: string;
  source_url: string;
  duration_minutes?: number | null;
  servings?: number | null;
  calories_per_serving?: number | null;
  protein_per_serving?: number | null;
  fat_per_serving?: number | null;
  carbs_per_serving?: number | null;
  ingredients?: RawIngredient[];
  steps?: RawStep[];
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
};

const CREATOR_META: Record<string, CreatorMeta> = {
  foxx_gotuje: {
    name: 'Foxx Gotuje',
    shortName: 'Foxx Gotuje',
    sourceUrl: 'https://adifoxx.pl/blog/',
    domain: 'adifoxx.pl',
    initials: 'FG',
    colors: ['#fe932c', '#f05b36'],
  },
  sam_the_cooking_guy: {
    name: 'Sam The Cooking Guy',
    shortName: 'Sam',
    sourceUrl: 'https://thecookingguy.com',
    domain: 'thecookingguy.com',
    initials: 'ST',
    colors: ['#168c68', '#0b4d42'],
  },
  nick_digiovanni: {
    name: 'Nick DiGiovanni',
    shortName: 'Nick',
    sourceUrl: 'https://nickskitchen.com/recipes',
    domain: 'nickskitchen.com',
    initials: 'ND',
    colors: ['#6956d8', '#312a75'],
  },
  joshua_weissman: {
    name: 'Joshua Weissman',
    shortName: 'Joshua',
    sourceUrl: 'https://www.joshuaweissman.com/recipes',
    domain: 'joshuaweissman.com',
    initials: 'JW',
    colors: ['#dc5366', '#721f39'],
  },
};

const FALLBACK_CREATOR: CreatorMeta = {
  name: 'Appetyt',
  shortName: 'Appetyt',
  sourceUrl: 'https://www.przepisnik.eu/',
  domain: 'przepisnik.eu',
  initials: 'CT',
  colors: ['#fe932c', '#6e3900'],
};

function imageDataUrl(label: string, colors: [string, string], wide = true) {
  const safeLabel = label.replace(/[<>&"']/g, '').slice(0, 24);
  const width = wide ? 960 : 160;
  const height = wide ? 600 : 160;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <circle cx="${width * 0.82}" cy="${height * 0.25}" r="${height * 0.32}" fill="#ffffff" opacity=".14"/>
    <circle cx="${width * 0.17}" cy="${height * 0.82}" r="${height * 0.45}" fill="#000000" opacity=".12"/>
    <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif" font-size="${wide ? 42 : 34}" font-weight="700">${safeLabel}</text>
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

function mapIngredient(raw: RawIngredient, index: number): Ingredient {
  const amount = raw.amount_value ?? null;
  const grams = raw.amount_g ?? null;
  const amountBase = amount !== null ? numeric(amount) : grams !== null ? numeric(grams) : 0;
  const unit = raw.unit?.trim() || (grams !== null ? 'g' : 'do smaku');
  const name = raw.name?.trim() || 'Składnik';
  const amountText = raw.amount_text?.trim() || name;
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

function mapStep(raw: RawStep, index: number): CookingStep {
  const description = raw.instructions?.trim() || raw.title?.trim() || 'Wykonaj etap zgodnie z przepisem.';
  const title = raw.title?.trim() || `Krok ${index + 1}`;
  const stepIngredients: StepIngredient[] = [];
  return {
    stepNumber: raw.step_number || index + 1,
    title,
    description,
    durationMinutes: raw.duration_minutes || undefined,
    stepIngredients,
  };
}

function mapRecipe(raw: RawRecipe): Recipe {
  const creator = CREATOR_META[raw.creator_id] || FALLBACK_CREATOR;
  let ingredients = (raw.ingredients || []).map(mapIngredient);
  const mappedSteps = (raw.steps || []).map(mapStep);
  const sourceSteps = raw.source_steps || [];
  const steps = mappedSteps.map((step, index) => {
    const stepText = [step.title, step.description, sourceSteps[index] || ''].join(' ');
    return {
      ...step,
      stepIngredients: ingredients
        .filter((ingredient) => isIngredientUsedInStep(stepText, ingredient))
        .map(stepIngredientFromRecipeIngredient),
    };
  });
  const calories = raw.calories_per_serving;
  const storeCosts: RecipeStoreCost[] = (raw.costs || []).map((cost) => ({
    store: cost.store,
    storeName: cost.store_name,
    currency: cost.currency,
    usageCostPln: cost.usage_cost_pln,
    basketCostPln: cost.basket_cost_pln,
    sourceUpdatedAt: cost.source_updated_at,
    lines: cost.lines.map((line) => ({
      ingredientName: line.ingredient_name,
      requiredAmount: line.required_amount,
      usageCostPln: line.usage_cost_pln,
      basketCostPln: line.basket_cost_pln,
      confidence: line.confidence,
      product: line.product
        ? {
            id: line.product.id,
            name: line.product.name,
            brand: line.product.brand,
            packageQty: line.product.package_qty,
            packageUnit: line.product.package_unit,
            pricePln: line.product.price_pln,
            pricePer100g: line.product.price_per_100g,
            pricePer100ml: line.product.price_per_100ml,
            sourceUrl: line.product.source_url,
          }
        : null,
    })),
  }));
  const cheapestStore = [...storeCosts]
    .filter((cost) => Number.isFinite(cost.basketCostPln) && cost.basketCostPln > 0)
    .sort((a, b) => a.basketCostPln - b.basketCostPln)[0];
  const price = cheapestStore?.basketCostPln ?? null;
  ingredients = ingredients.map((ingredient) => {
    const matchingLines = storeCosts
      .flatMap((store) => store.lines)
      .filter((line) => line.ingredientName.trim().toLowerCase() === ingredient.name.trim().toLowerCase());
    const pricedLine = matchingLines.find(
      (line) => line.usageCostPln !== null && line.usageCostPln !== undefined,
    );
    const pricedStore = pricedLine
      ? storeCosts.find((store) => store.lines.some((line) => line === pricedLine))
      : undefined;
    return {
      ...ingredient,
      estimatedPrice: pricedLine?.usageCostPln ?? undefined,
      store: pricedStore?.storeName,
    };
  });

  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle || undefined,
    categoryLabel: raw.category || 'Przepis',
    author: creator.name,
    authorAvatar: creator.initials,
    authorSourceUrl: creator.sourceUrl,
    sourceUrl: raw.source_url,
    authorSlug: raw.creator_id,
    imageUrl: imageDataUrl(creator.initials, creator.colors),
    imageAlt: `${raw.title} — ${creator.name}`,
    durationMinutes: numeric(raw.duration_minutes, 0),
    estimatedPrice: price === null ? 'brak ceny' : `${price.toFixed(2).replace('.', ',')} zł`,
    numericPrice: price || 0,
    caloriesText: calories === null || calories === undefined ? 'brak danych' : `${numeric(calories)} kcal`,
    caloriesPerServing: calories,
    proteinPerServing: raw.protein_per_serving,
    fatPerServing: raw.fat_per_serving,
    carbsPerServing: raw.carbs_per_serving,
    category: raw.category || 'Przepisy',
    cuisine: raw.cuisine || 'Autorska',
    verified: true,
    baseServings: Math.max(1, numeric(raw.servings, 1)),
    ingredients,
    steps,
    sourceSteps: raw.source_steps || [],
    storeCosts,
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
    avatarUrl: imageDataUrl(creator.initials, creator.colors, false),
    isVerified: true,
    isFollowing: false,
  };
}

export async function loadRecipeCatalog() {
  const response = await fetch('/recipes.json', {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać katalogu przepisów (${response.status})`);
  }
  const rawRecipes = (await response.json()) as RawRecipe[];
  const recipes = rawRecipes
    .filter((recipe) => CREATOR_META[recipe.creator_id])
    .map(mapRecipe);
  const orderedCreators = ['foxx_gotuje', 'sam_the_cooking_guy', 'nick_digiovanni', 'joshua_weissman'];
  const chefs = orderedCreators
    .map((creatorId) => mapChef(creatorId, recipes.filter((recipe) => recipe.authorSlug === creatorId)))
    .filter((chef) => chef.recipesCount > 0);
  return {recipes, chefs};
}
