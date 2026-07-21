import Constants from 'expo-constants';
import { ApiError, createApiClient } from '@marketnest/api-client';
import { secureStorage } from './storage';

export { ApiError };

/**
 * Resolves the API origin.
 *
 * "localhost" is the device's own loopback, not the dev machine — on a physical
 * phone or an Android emulator it resolves to nothing and every request fails
 * with a bare "Network request failed". In development we derive the host from
 * the Expo dev server the app was loaded from, which is by definition reachable
 * from this device.
 */
function resolveBaseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;

  if (__DEV__) {
    const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (devHost) return `http://${devHost}:3001`;
  }

  return configured ?? 'http://localhost:3001';
}

let onUnauthorizedHandler: (() => void) | null = null;

/** Registered by AuthProvider so a rejected token clears the session. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorizedHandler = handler;
}

export const api = createApiClient({
  baseUrl: resolveBaseUrl(),
  storage: secureStorage,
  // No `credentials` — React Native has no cookie jar. The guest cart travels
  // on the x-guest-session header instead.
  onUnauthorized: () => onUnauthorizedHandler?.(),
});

export const apiFetch = api.request;
