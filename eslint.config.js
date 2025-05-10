const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        confetti: 'readonly',
        fail: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    files: ['**/*.{js,ts}'],
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      'babel.config.js',
      'jest.config.js',
      'jest.setup.js',
      'eslint.config.js',
    ],
    rules: {
      'indent': ['warn', 2],
      'linebreak-style': ['off'],
      'quotes': ['warn', 'single'],
      'semi': ['warn', 'always'],
      'no-console': ['off'],
      'no-undef': ['warn'],
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/no-require-imports': ['warn'],
    },
  },
  {
    files: ['**/*.test.{js,ts}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
];
