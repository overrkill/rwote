module.exports = {
  env: {
    browser: true,
    es2020: true,
    webextensions: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-unused-vars': 'off'
  }
};
