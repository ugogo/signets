import {
  Heart,
  LayoutGrid,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Badge } from 'pickle-ui/badge';
import { Button } from 'pickle-ui/button';
import { Slider } from 'pickle-ui/slider';
import { Text } from 'pickle-ui/text';
import { type ReactNode, useEffect, useState } from 'react';

import {
  DEFAULT_DENSITY,
  DEFAULT_VIEW_MODE,
  type ViewMode,
} from '../lib/library-search-params';
import { REDUCED_MOTION_FADE, UI_SPRING } from '../lib/motion';
import { useScrollCompact } from '../lib/use-scroll-compact';
import { cn } from '../lib/utils';
import { Input, InputGroup } from './input-group';
import { ThemeToggle } from './theme-toggle';

export interface HomeChromeProps {
  authors: string[];
  children: ReactNode;
  density: number;
  favoritesOnly: boolean;
  isCanvas: boolean;
  onAuthorToggle: (authorHandle: string) => void;
  onDensityChange: (density: number) => void;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  onSearchChange: (search: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  selectedAuthor: string | null;
  shotCount: number;
  viewMode: ViewMode;
}

const segmentTrackClass =
  'inline-flex h-8 shrink-0 items-center gap-0.5 rounded-xl bg-muted/50 p-0.5';

const segmentButtonClass = 'press-scale h-7 rounded-lg px-2.5';

const FILTER_ICON_MOTION = {
  animate: { filter: 'blur(0px)', opacity: 1, scale: 1 },
  exit: { filter: 'blur(4px)', opacity: 0, scale: 0.25 },
  initial: { filter: 'blur(4px)', opacity: 0, scale: 0.25 },
  transition: UI_SPRING,
} as const;

/**
 * Floating pill chrome: search bar + filters tray.
 *
 * Border rule: one edge per surface. Pill owns the ring; InputGroup owns
 * the search shell; chips use shadow-border.
 */
export function HomeChrome({
  authors,
  children,
  density,
  favoritesOnly,
  isCanvas,
  onAuthorToggle,
  onDensityChange,
  onFavoritesOnlyChange,
  onSearchChange,
  onViewModeChange,
  search,
  selectedAuthor,
  shotCount,
  viewMode,
}: HomeChromeProps) {
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
  const densityTransition = reducedMotion
    ? REDUCED_MOTION_FADE
    : { duration: 0.15, ease: [0.23, 1, 0.32, 1] as const };
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
              <Input
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
              className="press-scale relative size-8 shrink-0 rounded-xl"
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
                <Badge
                  aria-hidden
                  className="absolute -top-1 -right-1 size-4 justify-center rounded-full bg-foreground p-0 text-[10px] text-background"
                  variant="secondary"
                >
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
                  reducedMotion
                    ? { opacity: 0 }
                    : { height: 0, opacity: 0 }
                }
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { height: 0, opacity: 0 }
                }
                key="filters-tray"
                style={{ overflow: 'hidden' }}
                transition={trayTransition}
              >
                <div className="mt-2 space-y-2 rounded-xl bg-muted/50 p-2">
                  <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                    <div className="space-y-1">
                      <Text as="p" tone="muted" variant="small">
                        View
                      </Text>
                      <div
                        aria-label="View mode"
                        className={segmentTrackClass}
                        role="group"
                      >
                        <Button
                          aria-pressed={viewMode === 'wall'}
                          className={cn(
                            segmentButtonClass,
                            viewMode === 'wall' && 'shadow-(--shadow-border)',
                          )}
                          onClick={() => onViewModeChange('wall')}
                          size="sm"
                          variant={viewMode === 'wall' ? 'secondary' : 'ghost'}
                        >
                          <LayoutGrid className="size-4" />
                          Wall
                        </Button>
                        <Button
                          aria-pressed={viewMode === 'canvas'}
                          className={cn(
                            segmentButtonClass,
                            viewMode === 'canvas' && 'shadow-(--shadow-border)',
                          )}
                          onClick={() => onViewModeChange('canvas')}
                          size="sm"
                          variant={
                            viewMode === 'canvas' ? 'secondary' : 'ghost'
                          }
                        >
                          <Map className="size-4" />
                          Canvas
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Text as="p" tone="muted" variant="small">
                        Favorites
                      </Text>
                      <Button
                        aria-label="Favorites only"
                        aria-pressed={favoritesOnly}
                        className={cn(
                          'press-scale size-8 rounded-xl',
                          favoritesOnly && 'shadow-(--shadow-border)',
                        )}
                        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
                        size="sm"
                        variant={favoritesOnly ? 'secondary' : 'outline'}
                      >
                        <Heart
                          className={cn(
                            'size-4',
                            favoritesOnly && 'fill-current text-red-500',
                          )}
                        />
                      </Button>
                    </div>

                    <AnimatePresence initial={false}>
                      {viewMode === 'wall' ? (
                        <motion.div
                          animate={{ opacity: 1 }}
                          className="min-w-36 space-y-1"
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          key="density"
                          transition={densityTransition}
                        >
                          <Text as="p" tone="muted" variant="small">
                            Density
                          </Text>
                          <div className="flex items-center gap-2 px-0.5">
                            <Slider
                              aria-label="Gallery density"
                              className="min-w-0 flex-1"
                              max={100}
                              min={0}
                              onValueChange={(value) => {
                                const next = Array.isArray(value)
                                  ? value[0]
                                  : value;
                                if (typeof next === 'number') {
                                  onDensityChange(next);
                                }
                              }}
                              step={10}
                              value={[density]}
                            />
                            <Text
                              as="span"
                              className="w-8 font-mono tabular-nums"
                              tone="muted"
                              variant="small"
                            >
                              {density}
                            </Text>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1">
                    <Text as="p" tone="muted" variant="small">
                      Authors
                    </Text>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                      {authors.map((handle) => (
                        <Button
                          aria-pressed={selectedAuthor === handle}
                          className={cn(
                            'press-scale h-7 shrink-0 rounded-full px-2.5 text-xs',
                            selectedAuthor === handle &&
                              'shadow-(--shadow-border)',
                          )}
                          key={handle}
                          onClick={() => onAuthorToggle(handle)}
                          size="sm"
                          variant={
                            selectedAuthor === handle ? 'secondary' : 'outline'
                          }
                        >
                          @{handle}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
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
