module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@screens': './src/screens',
            '@components': './src/components',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@constants': './constants',
            '@contexts': './src/contexts',
            '@store': './src/store',
            '@config': './src/config',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
