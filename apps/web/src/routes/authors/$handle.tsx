import type { Shot } from '@signets/shared';

import { createFileRoute } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

import { AuthorHeader } from '../../components/author-header';
import { HomeFilters } from '../../components/home-filters';
import { ShotCanvas } from '../../components/shot-canvas';
import { ShotGallery } from '../../components/shot-gallery';
import type { ViewMode } from '../../components/view-mode-toggle';
import { REDUCED_MOTION_FADE, UI_SPRING, VIEW_EXIT } from '../../lib/motion';
import { useInfiniteShots } from '../../lib/queries';
import { useDebouncedValue } from '../../lib/use-debounced-value';
import { cn } from '../../lib/utils';

export const Route = createFileRoute('/authors/$handle')({
  component: AuthorPage,
});

function AuthorPage() {
  const { handle } = Route.useParams();
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);
  const [viewMode, setViewMode] = useState<ViewMode>('wall');
  const [focusedShot, setFocusedShot] = useState<null | Shot>(null);

  const debouncedSearch = useDebouncedValue(search);

  const shotQueryParams = useMemo(
    () => ({
      author: handle,
      favorites: favoritesOnly || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch, favoritesOnly, handle],
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteShots(shotQueryParams);

  const shots = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const shotCount = data?.pages[0]?.total ?? 0;

  const isCanvas = viewMode === 'canvas';
  const reducedMotion = useReducedMotion() ?? false;
  const viewTransition = reducedMotion ? REDUCED_MOTION_FADE : UI_SPRING;
  const viewInitial = reducedMotion ? { opacity: 0 } : { filter: 'blur(4px)', opacity: 0, y: 12 };
  const viewExit = reducedMotion ? { opacity: 0 } : VIEW_EXIT;

  return (
    <div
      className={cn(
        'bg-background text-foreground',
        isCanvas ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-screen',
      )}
    >
      <header className="sticky-chrome sticky top-0 z-10">
        <AuthorHeader
          authorHandle={handle}
          onSearchChange={setSearch}
          search={search}
        />
      </header>

      <main
        className={cn(
          isCanvas
            ? 'flex min-h-0 flex-1 flex-col px-4 py-4'
            : 'mx-auto max-w-7xl px-4 py-6',
        )}
      >
        <HomeFilters
          density={density}
          favoritesOnly={favoritesOnly}
          onDensityChange={setDensity}
          onFavoritesOnlyChange={setFavoritesOnly}
          onViewModeChange={setViewMode}
          shotCount={shotCount}
          viewMode={viewMode}
        />

        <AnimatePresence mode="wait">
          {isCanvas ? (
            <motion.div
              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              className="min-h-0 flex-1"
              exit={viewExit}
              initial={viewInitial}
              key="canvas"
              transition={viewTransition}
            >
              <ShotCanvas
                emptyMessage={`No shots from @${handle}.`}
                error={error}
                fetchNextPage={fetchNextPage}
                focusedShot={focusedShot}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isLoading={isLoading}
                onFocusChange={setFocusedShot}
                resetKey={shotQueryParams}
                shots={shots}
                total={shotCount}
              />
            </motion.div>
          ) : (
            <motion.div
              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              exit={viewExit}
              initial={viewInitial}
              key="wall"
              transition={viewTransition}
            >
              <ShotGallery
                density={density}
                emptyMessage={`No shots from @${handle}.`}
                error={error}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isLoading={isLoading}
                shots={shots}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
