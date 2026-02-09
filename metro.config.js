const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const { resolver } = config;

// Enable SCSS extensions
config.resolver.sourceExts = [...resolver.sourceExts, "scss", "sass"];

// Apply NativeWind configuration
const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

// Override transformer to use our custom one (which delegates to NativeWind or Sass)
// nativeWindConfig.transformer.babelTransformerPath =
//   require.resolve("./custom-transformer.js");

module.exports = nativeWindConfig;
