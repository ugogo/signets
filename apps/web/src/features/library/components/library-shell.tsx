import { Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Badge } from 'pickle-ui/badge';
import { Button } from 'pickle-ui/button';
import { InputGroup } from 'pickle-ui/input-group';
import { Text } from 'pickle-ui/text';
import { type ReactNode, useEffect, useState } from 'react';

import {
  DEFAULT_DENSITY,
  DEFAULT_VIEW_MODE,
  type ViewMode,
} from '@/features/library/lib/library-search-params';
import { useScrollCompact } from '@/features/library/lib/use-scroll-compact';
import { ThemeToggle } from '@/features/theme/theme-toggle';
import { REDUCED_MOTION_FADE, UI_SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { LibraryFiltersTray } from './library-filters-tray';

export interface LibraryShellProps {
  authors: string[];
  children: ReactNode;
  curationToken: string;
  density: number;
  favoritesOnly: boolean;
  isCurator: boolean;
  onAuthorToggle: (authorHandle: string) => void;
  onClearCurationToken: () => void;
  onCopyLink: () => void;
  onCurationTokenChange: (token: string) => void;
  onDensityChange: (density: number) => void;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  onSaveCurationToken: () => void;
  onSearchChange: (search: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  selectedAuthor: null | string;
  shotCount: number;
  viewMode: ViewMode;
}

const FILTER_ICON_MOTION = {
  animate: { filter: 'blur(0px)', opacity: 1, scale: 1 },
  exit: { filter: 'blur(4px)', opacity: 0, scale: 0.25 },
  initial: { filter: 'blur(4px)', opacity: 0, scale: 0.25 },
  transition: UI_SPRING,
} as const;

/**
 * Library page frame: floating search pill, filters tray, and main content slot.
 *
 * Border rule: one edge per surface. Pill owns the ring; pickle InputGroup owns
 * the search shell; chips use secondary/outline variants.
 */
export function LibraryShell({
  authors,
  children,
  curationToken,
  density,
  favoritesOnly,
  isCurator,
  onAuthorToggle,
  onClearCurationToken,
  onCopyLink,
  onCurationTokenChange,
  onDensityChange,
  onFavoritesOnlyChange,
  onSaveCurationToken,
  onSearchChange,
  onViewModeChange,
  search,
  selectedAuthor,
  shotCount,
  viewMode,
}: LibraryShellProps) {
  const isCanvas = viewMode === 'canvas';
  const compact = useScrollCompact(24);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const activeFilterCount =
    (favoritesOnly ? 1 : 0) +
    (viewMode !== DEFAULT_VIEW_MODE ? 1 : 0) +
    (selectedAuthor ? 1 : 0) +
    (density !== DEFAULT_DENSITY ? 1 : 0);

  /** Tween (not spring) so height:auto exit actually runs and collapses. */
  const trayTransition = reducedMotion
    ? REDUCED_MOTION_FADE
    : { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const };
  const iconMotion = reducedMotion
    ? {
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        initial: { opacity: 0 },
        transition: REDUCED_MOTION_FADE,
      }
    : FILTER_ICON_MOTION;

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  return (
    <div
      className={cn(
        'bg-background text-foreground',
        isCanvas ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-screen',
      )}
    >
      <div className="pointer-events-none fixed inset-x-0 top-3 z-10 flex justify-center px-3">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-2xl rounded-2xl bg-card/90 p-2 shadow-lg ring-1 ring-border/50 backdrop-blur-xl transition-[max-width] duration-200 ease-out',
            compact && 'max-w-xl',
          )}
        >
          <div className="flex items-center gap-2">
            <div className="shrink-0 px-1.5">
              <Text className="tracking-tight" weight="bold">
                Signets
              </Text>
              {!compact ? (
                <Text
                  as="p"
                  className="font-mono tabular-nums"
                  tone="muted"
                  variant="small"
                >
                  {shotCount.toLocaleString()}
                </Text>
              ) : null}
            </div>

            <InputGroup className="min-w-0 flex-1">
              <InputGroup.Addon>
                <Search className="size-4 text-muted-foreground" />
              </InputGroup.Addon>
              <InputGroup.Input
                aria-label="Search caption or author"
                className="touch-input"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search…"
                value={search}
              />
            </InputGroup>

            <Button
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? 'Close filters' : 'Open filters'}
              onClick={() => setFiltersOpen((open) => !open)}
              size="sm"
              variant={
                filtersOpen || activeFilterCount > 0 ? 'secondary' : 'outline'
              }
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  className="flex items-center justify-center"
                  key={filtersOpen ? 'close' : 'filters'}
                  {...iconMotion}
                >
                  {filtersOpen ? (
                    <X className="size-4" />
                  ) : (
                    <SlidersHorizontal className="size-4" />
                  )}
                </motion.span>
              </AnimatePresence>
              {activeFilterCount > 0 && !filtersOpen ? (
                <Badge size="sm" variant="secondary">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>

            <ThemeToggle />
          </div>

          <AnimatePresence initial={false}>
            {filtersOpen ? (
              <motion.div
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { height: 'auto', opacity: 1 }
                }
                exit={
                  reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
                }
                initial={
                  reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
                }
                key="filters-tray"
                style={{ overflow: 'hidden' }}
                transition={trayTransition}
              >
                <LibraryFiltersTray
                  authors={authors}
                  curationToken={curationToken}
                  density={density}
                  favoritesOnly={favoritesOnly}
                  isCurator={isCurator}
                  onAuthorToggle={onAuthorToggle}
                  onClearCurationToken={onClearCurationToken}
                  onCopyLink={onCopyLink}
                  onCurationTokenChange={onCurationTokenChange}
                  onDensityChange={onDensityChange}
                  onFavoritesOnlyChange={onFavoritesOnlyChange}
                  onSaveCurationToken={onSaveCurationToken}
                  onViewModeChange={onViewModeChange}
                  selectedAuthor={selectedAuthor}
                  viewMode={viewMode}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div aria-hidden className="h-16" />

      <main
        className={cn(
          isCanvas
            ? 'flex min-h-0 flex-1 flex-col px-4 py-4'
            : 'mx-auto max-w-7xl px-4 py-6',
        )}
      >
        {children}
      </main>
    </div>
  );
}
