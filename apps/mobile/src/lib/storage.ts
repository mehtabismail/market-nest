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
const GUEST_KEY = 'mn_guest_session';

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

  getGuestSession: () => read(GUEST_KEY),
  setGuestSession: (id) => SecureStore.setItemAsync(GUEST_KEY, id),
  clearGuestSession: () => remove(GUEST_KEY),
};
