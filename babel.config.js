module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // https://callstack.github.io/react-native-paper/docs/guides/getting-started/
      'react-native-paper/babel',
    ],
  };
};
