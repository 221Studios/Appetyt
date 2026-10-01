import { apiRequest } from './api';

export interface RecipeRatingSummary {
  recipeId: string;
  averageScore: number | null;
  ratingCount: number;
  distribution: Record<string, number>;
  viewerScore: number | null;
}

class RatingRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Rating request failed with status ${status}`);
  }
}

function mapSummary(payload: {
  recipe_id: string;
  average_score: number | null;
  rating_count: number;
  distribution: Record<string, number>;
  viewer_score: number | null;
}): RecipeRatingSummary {
  return {
    recipeId: payload.recipe_id,
    averageScore: payload.average_score,
    ratingCount: payload.rating_count,
    distribution: payload.distribution,
    viewerScore: payload.viewer_score,
  };
}

async function readSummary(response: Response): Promise<RecipeRatingSummary> {
  if (!response.ok) throw new RatingRequestError(response.status);
  return mapSummary(await response.json());
}

export async function getRecipeRating(recipeId: string): Promise<RecipeRatingSummary> {
  return readSummary(await apiRequest(`/recipes/${encodeURIComponent(recipeId)}/rating`));
}

export async function saveRecipeRating(recipeId: string, score: number): Promise<RecipeRatingSummary> {
  return readSummary(
    await apiRequest(`/recipes/${encodeURIComponent(recipeId)}/rating`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({score}),
    }),
  );
}

export async function deleteRecipeRating(recipeId: string): Promise<void> {
  const response = await apiRequest(`/recipes/${encodeURIComponent(recipeId)}/rating`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new RatingRequestError(response.status);
}

export function isRatingAuthError(error: unknown): boolean {
  return error instanceof RatingRequestError && error.status === 401;
}
