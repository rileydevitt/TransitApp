// Babel configuration for the Expo/React Native toolchain.

/** Provides Babel configuration consumed by the Expo CLI. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin'
    ]
  };
};
