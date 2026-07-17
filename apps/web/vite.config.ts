import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const isStorybook = process.env.STORYBOOK === 'true';

const config = defineConfig(({ mode }) => ({
  plugins: [
    ...(!isStorybook ? [devtools()] : []),
    ...(!isStorybook && mode !== 'test'
      ? [cloudflare({ viteEnvironment: { name: 'ssr' } })]
      : []),
    tailwindcss(),
    ...(!isStorybook ? [tanstackStart()] : []),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
  },
}));

export default config;
