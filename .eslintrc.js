module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:node/recommended',
  ],
  plugins: [
    'chai-friendly',
  ],
  ignorePatterns: [
    '/node_modules/*',
  ],
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-expressions': 0,
    'chai-friendly/no-unused-expressions': 2,
    'no-param-reassign': 0,
    camelcase: 0,
    'node/exports-style': [
      'error',
      'module.exports'
    ],
    'node/file-extension-in-import': [
      'error',
      'always'
    ],
    'node/prefer-global/buffer': [
      'error',
      'always'
    ],
    'node/prefer-global/console': [
      'error',
      'always'
    ],
    'node/prefer-global/process': [
      'error',
      'always'
    ],
    'node/prefer-global/url-search-params': [
      'error',
      'always'
    ],
    'node/prefer-global/url': [
      'error',
      'always'
    ],
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',
    'node/no-unpublished-require': 0,
    'node/no-missing-require': 0,
    'import/no-extraneous-dependencies': 0,
    'node/no-unpublished-import': 0,
    'node/no-unsupported-features/es-syntax': 0,
    'import/extensions': [
      'error',
      {
        js: 'always',
        mjs: 'always',
        json: 'always',
      }
    ],
    'node/shebang': 0,
    'import/prefer-default-export': 0,
    'no-irregular-whitespace': 0,
    'lines-between-class-members': 0,
    'import/no-mutable-exports': 0
  },
};
