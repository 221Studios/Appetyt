const API_ROOT =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : 'https://appetyt.221studio.pl/api/v1');

export interface AuthStatus {
  authenticated: boolean;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await request('/auth/me');
  if (!response.ok) throw new Error('Auth status request failed');
  return response.json() as Promise<AuthStatus>;
}

export function getGoogleLoginUrl(): string {
  return `${API_ROOT}/auth/google/start`;
}

export async function logout(): Promise<void> {
  const response = await request('/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Logout failed');
}

export async function logoutAll(): Promise<void> {
  const response = await request('/auth/logout-all', { method: 'POST' });
  if (!response.ok) throw new Error('Logout-all failed');
}

export async function deleteAccount(): Promise<void> {
  const response = await request('/auth/account', { method: 'DELETE' });
  if (!response.ok) throw new Error('Account deletion failed');
}
