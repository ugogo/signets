import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from 'pickle-ui/button';

import { UI_SPRING } from '../lib/motion';
import { cn } from '../lib/utils';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  className?: string;
}

const ICON_MOTION = {
  animate: { filter: 'blur(0px)', opacity: 1, scale: 1 },
  exit: { filter: 'blur(4px)', opacity: 0, scale: 0.25 },
  initial: { filter: 'blur(4px)', opacity: 0, scale: 0.25 },
  transition: UI_SPRING,
} as const;

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative size-8 shrink-0 after:absolute after:top-1/2 after:left-1/2 after:size-9 after:-translate-x-1/2 after:-translate-y-1/2',
        className,
      )}
      onClick={toggleTheme}
      size="sm"
      variant="outline"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          className="flex items-center justify-center"
          key={isDark ? 'sun' : 'moon'}
          {...ICON_MOTION}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
