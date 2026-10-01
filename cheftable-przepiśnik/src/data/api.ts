export const API_ROOT =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : 'https://appetyt.221studio.pl/api/v1');

export async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });
}
