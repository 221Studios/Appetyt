import { apiRequest } from './api';

export type SubmissionStatus = 'submitted' | 'processing' | 'awaiting_review' | 'approved' | 'rejected' | 'failed';

export interface RecipeSubmissionAttempt {
  attempt_number: number;
  created_at: string;
  final_url: string | null;
  http_status: number | null;
  content_type: string | null;
  extracted_title: string | null;
  extracted_author: string | null;
  source_image_url: string | null;
  provenance: Record<string, string>;
  recipe_signals: Record<string, boolean>;
  content_flags: string[];
  recipe_confidence: number | null;
  parser_version: string | null;
  error_code: string | null;
  error_detail: string | null;
}

export interface RecipeSubmission {
  id: string;
  status: SubmissionStatus;
  submitted_url: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  published_recipe_id: string | null;
  latest_attempt?: RecipeSubmissionAttempt | null;
}

export interface AdminRecipeSubmission extends RecipeSubmission {
  submitted_by_user_id: string | null;
  final_url: string | null;
  extracted_title: string | null;
  extracted_author: string | null;
  source_image_url: string | null;
  recipe_confidence: number | null;
  content_flags: string[];
  title_override: string | null;
  author_override: string | null;
  image_override_url: string | null;
  admin_note: string | null;
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload.detail) return new Error(payload.detail);
  } catch {
    // Use the stable fallback when the API does not return JSON.
  }
  return new Error(fallback);
}

export async function listMyRecipeSubmissions(): Promise<RecipeSubmission[]> {
  const response = await apiRequest('/recipe-submissions');
  if (!response.ok) throw await responseError(response, 'Nie udało się pobrać zgłoszeń.');
  return (await response.json()) as RecipeSubmission[];
}

export async function createRecipeSubmission(url: string): Promise<RecipeSubmission> {
  const response = await apiRequest('/recipe-submissions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({url}),
  });
  if (!response.ok) throw await responseError(response, 'Nie udało się dodać zgłoszenia.');
  return (await response.json()) as RecipeSubmission;
}

export async function listAdminRecipeSubmissions(status?: SubmissionStatus): Promise<AdminRecipeSubmission[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await apiRequest(`/admin/recipe-submissions${query}`);
  if (!response.ok) throw await responseError(response, 'Nie udało się pobrać kolejki moderacji.');
  return (await response.json()) as AdminRecipeSubmission[];
}

export async function approveRecipeSubmission(
  id: string,
  payload: {title?: string; author_name?: string; image_url?: string; admin_note?: string},
): Promise<AdminRecipeSubmission> {
  const response = await apiRequest(`/admin/recipe-submissions/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await responseError(response, 'Nie udało się zatwierdzić zgłoszenia.');
  return (await response.json()) as AdminRecipeSubmission;
}

export async function rejectRecipeSubmission(id: string, reason: string): Promise<AdminRecipeSubmission> {
  const response = await apiRequest(`/admin/recipe-submissions/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({reason}),
  });
  if (!response.ok) throw await responseError(response, 'Nie udało się odrzucić zgłoszenia.');
  return (await response.json()) as AdminRecipeSubmission;
}

export async function retryRecipeSubmission(id: string): Promise<AdminRecipeSubmission> {
  const response = await apiRequest(`/admin/recipe-submissions/${encodeURIComponent(id)}/retry`, {method: 'POST'});
  if (!response.ok) throw await responseError(response, 'Nie udało się ponowić pobierania.');
  return (await response.json()) as AdminRecipeSubmission;
}

export async function uploadRecipeSubmissionImage(id: string, image: File): Promise<AdminRecipeSubmission> {
  const form = new FormData();
  form.append('image', image);
  const response = await apiRequest(`/admin/recipe-submissions/${encodeURIComponent(id)}/image`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw await responseError(response, 'Nie udało się zapisać okładki.');
  return (await response.json()) as AdminRecipeSubmission;
}
