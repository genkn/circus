module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: '10' } }],
    '@babel/preset-typescript'
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
  sourceMaps: true
};
