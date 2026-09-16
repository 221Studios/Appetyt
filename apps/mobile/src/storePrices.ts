import { CostLine, RecipeDetail, RecipeIngredient, StoreCost } from './api/types';
import { findMissingIngredients } from './ingredientMatching';
import { ShoppingItem } from './state/localState';

export const STORE_LABEL: Record<string, string> = {
  frisco: 'Frisco',
  auchan: 'Auchan',
  carrefour: 'Carrefour',
};

export const LOYALTY_FACTOR = 0.92;

export type PricedProduct = {
  price: number;
  store: string;
  storeSlug: string;
  name: string;
  updatedAt: string | null;
};

export function applyLoyalty(price: number, discounts: boolean): number {
  const next = discounts ? price * LOYALTY_FACTOR : price;
  return Math.round(next * 100) / 100;
}

export function cheapestStore(costs: StoreCost[]): StoreCost | undefined {
  return [...costs].sort((left, right) => left.basket_cost_pln - right.basket_cost_pln)[0];
}

export function cheapestLine(costs: StoreCost[], ingredientName: string): { line: CostLine; store: StoreCost; price: number } | undefined {
  const needle = ingredientName.trim().toLocaleLowerCase();
  let best: { line: CostLine; store: StoreCost; price: number } | undefined;
  for (const store of costs) {
    const line = store.lines.find((item) => item.ingredient_name.trim().toLocaleLowerCase() === needle);
    const price = line?.basket_cost_pln ?? line?.product?.price_pln;
    if (!line?.product || price == null) continue;
    if (!best || best.price > price) {
      best = { line, store, price };
    }
  }
  return best;
}

export function shoppingItemsFromRecipe(recipe: RecipeDetail, fridge: string[], discounts: boolean): ShoppingItem[] {
  return findMissingIngredients(recipe.ingredients, fridge).map((ingredient, index) => {
    const priced = cheapestLine(recipe.costs, ingredient.name);
    const price = priced?.price;
    const productName = priced?.line.product?.name;
    return {
      id: `${recipe.id}-${ingredient.ingredient_id ?? index}`,
      title: `${ingredient.name} · ${ingredient.amount_text}`,
      recipeTitle: recipe.title,
      subtitle: productName
        ? `${productName} · orientacyjnie`
        : 'Brak ceny w katalogu sklepów',
      price: price != null ? applyLoyalty(price, discounts) : undefined,
      storeName: priced ? (STORE_LABEL[priced.store.store] ?? priced.store.store_name) : undefined,
      group: recipe.id,
      groupTitle: recipe.title,
      isBought: false,
    };
  });
}

export function formatPln(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function storeUpdatedLabel(cost: StoreCost): string {
  if (!cost.source_updated_at) return 'data aktualizacji: brak';
  const date = new Date(cost.source_updated_at);
  if (Number.isNaN(date.getTime())) return 'data aktualizacji: brak';
  return `aktualizacja ${date.toLocaleDateString('pl-PL')}`;
}

const SEARCH_ALIASES: { match: RegExp; query: string }[] = [
  { match: /olive oil|oliwa/i, query: 'oliwa z oliwek' },
  { match: /corn\s*starch|skrobia kukurydz/i, query: 'skrobia kukurydziana' },
  { match: /potato starch|skrobia ziemniacz/i, query: 'skrobia ziemniaczana' },
];

const JUNK_PRODUCT = /chips|chipsy|hummus|grissini|bruschetta|nori|parboiled|paluszki|warzywa na patel/i;

export function searchToken(title: string): string {
  const cleaned = title.replace(/·.*$/, '').trim();
  const alias = SEARCH_ALIASES.find((entry) => entry.match.test(cleaned));
  if (alias) return alias.query;
  return cleaned.split(/\s+/).slice(0, 2).join(' ');
}

export function pickCheapestProduct(items: { name: string; store: string; price_pln: number; source_updated_at?: string | null }[]): PricedProduct | undefined {
  const ranked = items.filter((item) => !JUNK_PRODUCT.test(item.name)).sort((left, right) => left.price_pln - right.price_pln);
  const hit = ranked[0] ?? [...items].sort((left, right) => left.price_pln - right.price_pln)[0];
  if (!hit) return undefined;
  return {
    price: hit.price_pln,
    store: STORE_LABEL[hit.store] ?? hit.store,
    storeSlug: hit.store,
    name: hit.name,
    updatedAt: hit.source_updated_at ?? null,
  };
}
