import { RecipeDetail, RecipeSummary } from './types';

type RecipeList = { items: RecipeSummary[]; total: number; limit: number; offset: number };

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getRecipes: () => request<RecipeList>('/recipes?limit=100'),
  getRecipe: (id: string) => request<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`),
};

export { API_URL };
