import { RecipeSummary } from './api/types';
import { recipeLookAuthor, recipeLookCategory, recipeLookPrice, recipeLookSource } from './referenceLook';

export function recipePrice(recipe: RecipeSummary): string {
  return recipeLookPrice(recipe);
}

export function creatorName(recipe: RecipeSummary): string {
  return recipeLookAuthor(recipe);
}

export function creatorSource(recipe: RecipeSummary): string {
  return recipeLookSource(recipe);
}

export function recipeCategory(recipe: RecipeSummary): string {
  return recipeLookCategory(recipe);
}
