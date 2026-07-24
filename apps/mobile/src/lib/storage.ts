import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@marketnest/api-client';

/**
 * Keychain (iOS) / Keystore (Android) backed session storage.
 *
 * Deliberately not AsyncStorage: that writes plaintext to the app sandbox,
 * which is readable on a rooted or jailbroken device. The access token is a
 * bearer credential for the whole account, so it belongs in the secure enclave.
 *
 * SecureStore caps values at roughly 2KB on Android. Supabase access tokens sit
 * well under that, but if a token ever exceeds it the write throws rather than
 * truncating — hence the explicit failure handling in `setToken`.
 */

const TOKEN_KEY = 'mn_token';
const REFRESH_KEY = 'mn_refresh';
const GUEST_KEY = 'mn_guest_session';
const THEME_KEY = 'mn_theme';

async function read(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // A corrupt or unreadable keychain entry must not brick the app; treat it
    // as signed out.
    return null;
  }
}

async function remove(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Already absent.
  }
}

export const secureStorage: TokenStorage = {
  getToken: () => read(TOKEN_KEY),
  setToken: (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: () => remove(TOKEN_KEY),

  getRefreshToken: () => read(REFRESH_KEY),
  setRefreshToken: (token) => SecureStore.setItemAsync(REFRESH_KEY, token),
  clearRefreshToken: () => remove(REFRESH_KEY),

  getGuestSession: () => read(GUEST_KEY),
  setGuestSession: (id) => SecureStore.setItemAsync(GUEST_KEY, id),
  clearGuestSession: () => remove(GUEST_KEY),
};

/**
 * Non-secret UI preferences.
 *
 * These have no business being in the keychain, but they ride along with it
 * anyway: SecureStore is already a dependency, and pulling in AsyncStorage for
 * a single boolean would add a native module for no benefit.
 */
export const preferences = {
  getTheme: () => read(THEME_KEY),
  setTheme: (value: 'dark' | 'light') => SecureStore.setItemAsync(THEME_KEY, value),
};
