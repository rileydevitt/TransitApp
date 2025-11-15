// Resolves the backend API base URL based on environment variables.

import Constants from 'expo-constants';

/** Determines the backend base URL from Expo config or defaults. */
export default function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:4000`;
    }
  }

  return 'http://localhost:4000';
}
