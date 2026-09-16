import type { RecipeSummary } from './api/types';

export type RecipeListResponse = { items: RecipeSummary[]; total: number; limit: number; offset: number };

export function createRecipeLoader(
  getRecipes: () => Promise<RecipeListResponse>,
  onLoaded: (recipes: RecipeSummary[]) => void,
  onFailed: () => void,
) {
  let latestRequest = 0;

  return async () => {
    const request = ++latestRequest;
    try {
      const response = await getRecipes();
      if (request !== latestRequest) return;
      onLoaded(response.items);
    } catch {
      if (request !== latestRequest) return;
      onFailed();
    }
  };
}
