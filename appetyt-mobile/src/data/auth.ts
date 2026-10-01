import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { API_ROOT, apiRequest } from './api';
const MOBILE_AUTH_PROTOCOL = 'appetyt:';

export interface AuthStatus {
  authenticated: boolean;
  is_admin?: boolean;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await apiRequest('/auth/me');
  if (!response.ok) throw new Error('Auth status request failed');
  return response.json() as Promise<AuthStatus>;
}

export function getGoogleLoginUrl(mobile = false): string {
  return `${API_ROOT}/auth/google/start${mobile ? '?client=mobile' : ''}`;
}

export async function startGoogleLogin(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.assign(getGoogleLoginUrl());
    return;
  }
  await Browser.open({url: getGoogleLoginUrl(true)});
}

async function exchangeMobileAuthCode(code: string): Promise<void> {
  const response = await apiRequest('/auth/mobile/exchange', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({code}),
  });
  if (!response.ok) throw new Error('Mobile auth exchange failed');
}

export async function registerMobileAuthListener(
  onAuthenticated: () => void,
  onError: () => void,
): Promise<() => Promise<void>> {
  if (!Capacitor.isNativePlatform()) return async () => {};

  let processing = false;
  const handleUrl = async (url: string) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    if (
      parsed.protocol !== MOBILE_AUTH_PROTOCOL ||
      parsed.hostname !== 'auth' ||
      parsed.pathname !== '/callback'
    ) {
      return;
    }
    const code = parsed.searchParams.get('code');
    if (!code || processing) return;
    processing = true;
    try {
      await exchangeMobileAuthCode(code);
      try {
        await Browser.close();
      } catch {
        // The system browser may already be closed when the app receives the deep link.
      }
      onAuthenticated();
    } catch {
      onError();
    } finally {
      processing = false;
    }
  };

  const listener = await App.addListener('appUrlOpen', ({url}) => {
    void handleUrl(url);
  });
  const launchUrl = await App.getLaunchUrl();
  if (launchUrl?.url) void handleUrl(launchUrl.url);

  return async () => {
    await listener.remove();
  };
}

export async function logout(): Promise<void> {
  const response = await apiRequest('/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Logout failed');
}

export async function logoutAll(): Promise<void> {
  const response = await apiRequest('/auth/logout-all', { method: 'POST' });
  if (!response.ok) throw new Error('Logout-all failed');
}

export async function deleteAccount(): Promise<void> {
  const response = await apiRequest('/auth/account', { method: 'DELETE' });
  if (!response.ok) throw new Error('Account deletion failed');
}
