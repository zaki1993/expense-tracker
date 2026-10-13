import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

const KEY = 'google-oauth-token-v1';

export type GoogleTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
};

export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export function googleClientId(): string {
  const ids = (Constants.expoConfig?.extra?.googleOAuth ?? {}) as Record<string, string>;
  const id = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ids.androidClientId;
  if (!id) {
    throw new Error(
      'Google OAuth is not configured. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env and rebuild the Android app.',
    );
  }
  return id;
}

export function googleRedirectUri(): string {
  let clientId = '';
  try {
    clientId = googleClientId();
  } catch {
    // Settings must still render before the user configures OAuth.
  }
  if (!clientId) {
    return AuthSession.makeRedirectUri({ scheme: 'expensetracker', path: 'oauthredirect' });
  }
  const scheme = `com.googleusercontent.apps.${clientId.split('.')[0]}`;
  return AuthSession.makeRedirectUri({ native: `${scheme}:/oauthredirect` });
}

export async function saveTokens(tokens: GoogleTokenSet) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(KEY);
}

export async function loadTokens(): Promise<GoogleTokenSet | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleTokenSet;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function getAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('Connect your Google account in Settings.');
  if (tokens.expiresAt > Date.now() + 60_000) return tokens.accessToken;
  if (!tokens.refreshToken) {
    await clearTokens();
    throw new Error('Google access expired. Reconnect your account in Settings.');
  }
  try {
    const refreshed = await AuthSession.refreshAsync(
      { clientId: googleClientId(), refreshToken: tokens.refreshToken },
      { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
    );
    const next: GoogleTokenSet = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
      expiresAt: Date.now() + (refreshed.expiresIn ?? 3600) * 1000,
      scope: refreshed.scope ?? tokens.scope,
    };
    await saveTokens(next);
    return next.accessToken;
  } catch {
    await clearTokens();
    throw new Error('Google authorization expired or was revoked. Reconnect your account in Settings.');
  }
}

export async function revokeGoogleAccess() {
  const tokens = await loadTokens();
  if (tokens?.accessToken) {
    try {
      await fetch(
        'https://oauth2.googleapis.com/revoke?token=' +
          encodeURIComponent(tokens.refreshToken ?? tokens.accessToken),
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
    } catch {
      // Always remove local credentials.
    }
  }
  await clearTokens();
}
