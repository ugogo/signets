// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import perfectionist from 'eslint-plugin-perfectionist';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export function createSignetsEslintConfig() {
  const perfectionistRules = perfectionist.configs['recommended-natural'].rules;

  return tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/.pnpm/**',
        '**/dist/**',
        '**/.output/**',
        '**/.wrangler/**',
        '**/coverage/**',
        '**/.agents/**',
        '**/.claude/**',
        '**/.cursor/**',
        '**/.scratch/**',
        '**/storybook-static/**',
        '**/*.min.js',
        '**/routeTree.gen.ts',
        '**/eslint.config.mjs',
        'apps/extension/public/**',
        'packages/eslint-config/**',
      ],
    },
    eslint.configs.recommended,
    eslintConfigPrettier,
    eslintPluginPrettierRecommended,
    {
      plugins: {
        perfectionist,
      },
      rules: {
        ...perfectionistRules,
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
    {
      files: ['apps/api/**/*.ts'],
      extends: [...tseslint.configs.recommended],
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['packages/shared/**/*.ts'],
      extends: [...tseslint.configs.recommended],
      languageOptions: {
        globals: globals.node,
      },
    },
    {
      files: ['apps/extension/**/*.ts'],
      extends: [...tseslint.configs.recommended],
      languageOptions: {
        globals: {
          ...globals.browser,
        },
      },
    },
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: [...tseslint.configs.recommended],
      plugins: {
        react,
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      languageOptions: {
        globals: globals.browser,
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
        'react/react-in-jsx-scope': 'off',
      },
    },
  );
}
