import type { Decorator } from '@storybook/react-vite';

import '@fontsource-variable/geist/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import { ThemeProvider } from '../src/components/theme-provider';
import { type Theme } from '../src/lib/theme';
import '../src/styles.css';

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as Theme | undefined) ?? 'dark';

  return (
    <ThemeProvider defaultTheme={theme} key={theme}>
      <div className="min-h-screen bg-background p-6 text-foreground">
        <Story />
      </div>
    </ThemeProvider>
  );
};

const preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: {
        dynamicTitle: true,
        icon: 'mirror',
        items: [
          { title: 'Light', value: 'light' },
          { title: 'Dark', value: 'dark' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
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
