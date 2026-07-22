import { createContext, useContext } from 'react';

import type { Theme } from '../lib/theme';

export interface ThemeContextValue {
  setTheme: (theme: Theme) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<null | ThemeContextValue>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
