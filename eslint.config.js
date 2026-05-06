import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'coverage/', 'node_modules/', '.nyc_output/'],
  },
  js.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['test/**/*.js', 'test/**/*.cjs'],
    rules: {
      'n/no-unpublished-import': 'off',
    },
  },
  {
    files: ['test/fixtures/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
