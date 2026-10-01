import { Recipe } from '../types';

export const SEARCH_PAGE_SIZE = 40;
export const SEARCH_CARD_HEIGHT = 176;
export const SEARCH_CARD_GAP = 10;
export const SEARCH_ROW_HEIGHT = SEARCH_CARD_HEIGHT + SEARCH_CARD_GAP;
export const SEARCH_OVERSCAN = 6;

export function getVisibleRecipeRange(
  itemCount: number,
  scrollTop: number,
  viewportHeight: number,
): [number, number] {
  const first = Math.min(
    itemCount,
    Math.max(0, Math.floor(Math.max(0, scrollTop) / SEARCH_ROW_HEIGHT) - SEARCH_OVERSCAN),
  );
  const last = Math.min(
    itemCount,
    Math.max(first, Math.ceil((Math.max(0, scrollTop) + viewportHeight) / SEARCH_ROW_HEIGHT) + SEARCH_OVERSCAN),
  );
  return [first, last];
}

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('ł', 'l')
    .trim();
}

export function buildRecipeSearchIndex(recipes: Recipe[]): Map<string, string> {
  return new Map(
    recipes.map((recipe) => [
      recipe.id,
      normalizeSearchText([
        recipe.title,
        recipe.subtitle,
        recipe.category,
        recipe.categoryLabel,
        recipe.cuisine,
        recipe.author,
        ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ingredient.categoryDetail]),
      ].filter(Boolean).join(' ')),
    ]),
  );
}

export function filterRecipes(
  recipes: Recipe[],
  searchIndex: Map<string, string>,
  query: string,
): Recipe[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return recipes;
  return recipes.filter((recipe) => searchIndex.get(recipe.id)?.includes(normalizedQuery));
}
