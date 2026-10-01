const viteEnv = (import.meta as ImportMeta & {
  env?: { VITE_API_URL?: string; DEV?: boolean };
}).env;

export const API_ROOT =
  viteEnv?.VITE_API_URL ||
  (viteEnv?.DEV ? 'http://localhost:8000/api/v1' : 'https://appetyt.221studio.pl/api/v1');

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
