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

/** @param {string} rootDir */
export function createSignetsEslintConfig(rootDir) {
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
      extends: [...tseslint.configs.recommendedTypeChecked],
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        parserOptions: {
          projectService: true,
          tsconfigRootDir: `${rootDir}/apps/api`,
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
      },
    },
    {
      files: ['packages/shared/**/*.ts'],
      extends: [...tseslint.configs.recommendedTypeChecked],
      languageOptions: {
        globals: globals.node,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: `${rootDir}/packages/shared`,
        },
      },
    },
    {
      files: ['apps/extension/**/*.ts'],
      extends: [...tseslint.configs.recommendedTypeChecked],
      languageOptions: {
        globals: {
          ...globals.browser,
        },
        parserOptions: {
          projectService: true,
          tsconfigRootDir: `${rootDir}/apps/extension`,
        },
      },
    },
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: [
        ...tseslint.configs.recommendedTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        react,
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      languageOptions: {
        globals: globals.browser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: `${rootDir}/apps/web`,
        },
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
    {
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
  );
}
