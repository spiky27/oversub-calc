import js from '@eslint/js';
import html from 'eslint-plugin-html';

export default [
  js.configs.recommended,
  {
    files: ['**/*.html'],
    plugins: { html },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
];
