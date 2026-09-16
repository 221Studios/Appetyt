import { RecipeSummary } from './api/types';

export function searchRecipes(recipes: RecipeSummary[], query: string): RecipeSummary[] {
  const value = query.trim().toLocaleLowerCase();
  return recipes.filter((recipe) => {
    const searchable = [recipe.title, recipe.category, recipe.cuisine ?? '', ...recipe.ingredient_names]
      .join(' ')
      .toLocaleLowerCase();
    return !value || searchable.includes(value);
  });
}
