// Expo app configuration describing bundle settings and environment.

const loadEnvFromFile = require('./loadEnv');

loadEnvFromFile();

const baseConfig = require('./app.json');
const expoConfig = baseConfig.expo ?? {};

const mapsKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  expoConfig.ios?.config?.googleMapsApiKey ??
  expoConfig.android?.config?.googleMaps?.apiKey ??
  '';

const resolvedBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/** Builds the Expo config object with resolved secrets and map keys. */
module.exports = () => ({
  ...baseConfig,
  expo: {
    ...expoConfig,
    ios: {
      ...expoConfig.ios,
      config: {
        ...expoConfig.ios?.config,
        googleMapsApiKey: mapsKey
      }
    },
    android: {
      ...expoConfig.android,
      config: {
        ...expoConfig.android?.config,
        googleMaps: {
          ...expoConfig.android?.config?.googleMaps,
          apiKey: mapsKey
        }
      }
    },
    extra: {
      ...expoConfig.extra,
      apiBaseUrl: resolvedBaseUrl
    }
  }
});

/** Hydrates process.env from the project root .env file. */
