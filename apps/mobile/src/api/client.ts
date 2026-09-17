import { RecipeDetail, RecipeSummary } from './types';
import { pickCheapestProduct, searchToken } from '../storePrices';

type RecipeList = { items: RecipeSummary[]; total: number; limit: number; offset: number };
type ProductList = { items: StoreProduct[]; total: number; store: string };

export type StoreProduct = {
  id: string;
  store: string;
  name: string;
  brand: string | null;
  package_qty: number;
  package_unit: string;
  price_pln: number;
  is_estimate: boolean;
  source_updated_at: string | null;
};

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const SHELF_QUERIES = ['carbonara', 'szakszuka', 'penne', 'curry', 'owsianka', 'pappardelle', 'zupa'];
const STORES = ['frisco', 'auchan', 'carrefour'] as const;

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function mergeRecipes(groups: RecipeSummary[][]): RecipeSummary[] {
  const byId = new Map<string, RecipeSummary>();
  for (const group of groups) {
    for (const recipe of group) byId.set(recipe.id, recipe);
  }
  return [...byId.values()];
}

export const api = {
  getRecipes: async () => {
    const [catalog, ...shelf] = await Promise.all([
      request<RecipeList>('/recipes?limit=40'),
      ...SHELF_QUERIES.map((query) => request<RecipeList>(`/recipes?limit=8&q=${encodeURIComponent(query)}`)),
    ]);
    const items = mergeRecipes([catalog.items, ...shelf.map((page) => page.items)]);
    return { items, total: catalog.total, limit: items.length, offset: 0 };
  },
  searchRecipes: (query: string) =>
    request<RecipeList>(`/recipes?limit=100&q=${encodeURIComponent(query)}`),
  getRecipe: (id: string) => request<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`),
  cheapestProduct: async (query: string) => {
    const token = searchToken(query);
    if (!token) return undefined;
    const pages = await Promise.all(STORES.map(async (store) => {
      try {
        return await request<ProductList>(`/stores/${store}/products?limit=8&q=${encodeURIComponent(token)}`);
      } catch {
        return { items: [] as StoreProduct[], total: 0, store };
      }
    }));
    return pickCheapestProduct(pages.flatMap((page) => page.items));
  },
};

export { API_URL };
