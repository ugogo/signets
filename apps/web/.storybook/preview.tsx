import type { Preview } from '@storybook/react-vite';

import '@fontsource-variable/geist/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '../src/styles.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
