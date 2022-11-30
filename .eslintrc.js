module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    mocha: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: ['eslint:recommended'],
  plugins: [],
  overrides: [
    {
      files: ['test/**/*.js'],
      rules: {
        'max-lines': 0,
      },
    },
  ],
};
