module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  rules: {
    semi: [1, 'never']
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
