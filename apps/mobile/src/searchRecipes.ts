import { RecipeSummary } from './api/types';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function searchRecipes(recipes: RecipeSummary[], query: string): RecipeSummary[] {
  const value = normalize(query);
  return recipes.filter((recipe) => {
    const searchable = [recipe.title, recipe.subtitle ?? '', recipe.category, recipe.cuisine ?? '', recipe.creator?.name ?? '', ...recipe.ingredient_names].map(normalize).join(' ');
    return !value || searchable.includes(value);
  });
}
