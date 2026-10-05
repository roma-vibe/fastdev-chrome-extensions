import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// One config for the whole workspace: scripts/ and every extension folder (`*/src/**`).
const layerMessage = 'Views, components and stores reach it through src/services (see AGENTS.md).';

export default defineConfig(
  globalIgnores(['**/dist/', '**/coverage/']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  vue.configs['flat/strongly-recommended'],

  {
    languageOptions: {
      parserOptions: {
        // Each file is checked with the nearest tsconfig.json (the root one or the extension's).
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['*/src/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.ts', '**/*.config.{js,ts}', '**/*.config.test.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    rules: {
      eqeqeq: ['error', 'always'],
      'object-shorthand': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // TypeScript (vue-tsc) checks undefined names in .vue files.
      'no-undef': 'off',
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'error',
      'vue/require-default-prop': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '*/src/test/**'],
    rules: { '@typescript-eslint/explicit-function-return-type': 'off' },
  },
  {
    // Layer rule: only services (and the service worker) touch chrome.*, storage and the network.
    files: ['*/src/**/*.{ts,vue}'],
    ignores: ['*/src/services/**', '*/src/background/**', '*/src/test/**', '**/*.test.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'chrome', message: `Chrome APIs belong in src/services/chrome. ${layerMessage}` },
        { name: 'fetch', message: `Use the API client in src/services/api. ${layerMessage}` },
        { name: 'localStorage', message: `Use src/services/storage. ${layerMessage}` },
        { name: 'sessionStorage', message: `Use src/services/storage. ${layerMessage}` },
        { name: 'indexedDB', message: `Use src/services/storage. ${layerMessage}` },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'globalThis', property: 'chrome', message: layerMessage },
        { object: 'window', property: 'chrome', message: layerMessage },
        { object: 'window', property: 'fetch', message: layerMessage },
        { object: 'window', property: 'localStorage', message: layerMessage },
      ],
    },
  },

  prettier,
);
