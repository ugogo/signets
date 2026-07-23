import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  type Theme,
  THEME_STORAGE_KEY,
} from './theme';
import { ThemeContext } from './theme-context';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => defaultTheme ?? resolveTheme(getStoredTheme()),
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  useEffect(() => {
    if (defaultTheme) {
      applyTheme(defaultTheme);
      return;
    }

    const stored = getStoredTheme();
    const resolved = resolveTheme(stored);
    setThemeState(resolved);
    applyTheme(resolved);

    if (stored) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = getSystemTheme();
      setThemeState(next);
      applyTheme(next);
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [defaultTheme]);

  const value = useMemo(
    () => ({ setTheme, theme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
