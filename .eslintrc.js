module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  rules: {
    semi: ['warn', 'never'],
    'no-empty': ['warn', { allowEmptyCatch: true }]
  },
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020
  }
}
