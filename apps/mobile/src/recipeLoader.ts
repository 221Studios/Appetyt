import type { RecipeSummary } from './api/types';

export type RecipeListResponse = { items: RecipeSummary[]; total: number; limit: number; offset: number };

export function createRecipeLoader(
  getRecipes: () => Promise<RecipeListResponse>,
  onLoaded: (recipes: RecipeSummary[]) => void,
  onFailed: () => void,
) {
  return async () => {
    try {
      const response = await getRecipes();
      onLoaded(response.items);
    } catch {
      onFailed();
    }
  };
}
