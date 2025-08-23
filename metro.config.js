const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions for web bundling
config.resolver.assetExts.push('wasm');

// Add support for react-native-google-mobile-ads
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;