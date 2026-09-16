import { describe, expect, it, vi } from 'vitest';

import { RecipeSummary } from './api/types';
import { createRecipeLoader, RecipeListResponse } from './recipeLoader';

describe('ładowanie listy przepisów', () => {
  it('po błędzie pozwala ponowić żądanie i przyjąć odzyskaną listę', async () => {
    const recoveredRecipes = [{ id: 'carbonara-test' } as RecipeSummary];
    const getRecipes = vi.fn<() => Promise<RecipeListResponse>>()
      .mockRejectedValueOnce(new Error('API unavailable'))
      .mockResolvedValueOnce({ items: recoveredRecipes, total: 1, limit: 100, offset: 0 });
    const onLoaded = vi.fn();
    const onFailed = vi.fn();
    const loadRecipes = createRecipeLoader(getRecipes, onLoaded, onFailed);

    await loadRecipes();
    expect(onFailed).toHaveBeenCalledOnce();
    expect(onLoaded).not.toHaveBeenCalled();

    await loadRecipes();
    expect(onLoaded).toHaveBeenCalledWith(recoveredRecipes);
    expect(getRecipes).toHaveBeenCalledTimes(2);
  });
});
