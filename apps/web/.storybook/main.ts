import type { StorybookConfig } from '@storybook/react-vite';

import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

function getPluginName(plugin: unknown): string {
  if (!plugin || typeof plugin !== 'object' || !('name' in plugin)) {
    return '';
  }

  return String(plugin.name);
}

const blockedPluginFragments = [
  'tanstack',
  'cloudflare',
  'devtools-vite',
  'router-plugin',
];

const config: StorybookConfig = {
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  viteFinal(viteConfig) {
    const plugins = (viteConfig.plugins ?? []).flat().filter((plugin) => {
      const name = getPluginName(plugin);
      return !blockedPluginFragments.some((fragment) =>
        name.includes(fragment),
      );
    });

    if (
      !plugins.some((plugin) => getPluginName(plugin).includes('tailwindcss'))
    ) {
      plugins.push(tailwindcss());
    }

    return {
      ...viteConfig,
      plugins,
      resolve: {
        ...viteConfig.resolve,
        alias: {
          ...(typeof viteConfig.resolve?.alias === 'object' &&
          !Array.isArray(viteConfig.resolve.alias)
            ? viteConfig.resolve.alias
            : {}),
          '@': path.resolve(dirname, '../src'),
        },
      },
    };
  },
};

export default config;
