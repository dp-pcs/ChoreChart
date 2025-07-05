const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable problematic development features that are causing React component errors
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Ensure React Native is resolved properly
config.resolver = {
  ...config.resolver,
  alias: {
    'react-native': require.resolve('react-native'),
  },
};

module.exports = config; 