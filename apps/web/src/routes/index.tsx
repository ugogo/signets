import type { Shot } from '@signets/shared';

import { createFileRoute } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQueryStates } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import { HomeChrome } from '../components/home-chrome';
import { ShotCanvas } from '../components/shot-canvas';
import { ShotFocus } from '../components/shot-focus';
import { ShotGallery } from '../components/shot-gallery';
import {
  librarySearchParams,
  librarySearchSchema,
} from '../lib/library-search-params';
import { REDUCED_MOTION_FADE, UI_SPRING, VIEW_EXIT } from '../lib/motion';
import { useInfiniteShots, useShotAuthors } from '../lib/queries';
import { useDebouncedValue } from '../lib/use-debounced-value';

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: librarySearchSchema,
});

function Home() {
  const [filters, setFilters] = useQueryStates(librarySearchParams);
  const { author, density, favorites, search, viewMode } = filters;
  const [focusedShot, setFocusedShot] = useState<null | Shot>(null);

  const debouncedSearch = useDebouncedValue(search ?? '');

  const shotQueryParams = useMemo(
    () => ({
      author: author ?? undefined,
      favorites: favorites || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [author, debouncedSearch, favorites],
  );

  const authorQueryParams = useMemo(
    () => ({
      favorites: favorites || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch, favorites],
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteShots(shotQueryParams);
  const { data: authors = [] } = useShotAuthors(authorQueryParams);

  const shots = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const shotCount = data?.pages[0]?.total ?? 0;

  const isCanvas = viewMode === 'canvas';
  const reducedMotion = useReducedMotion() ?? false;
  const viewTransition = reducedMotion ? REDUCED_MOTION_FADE : UI_SPRING;
  const viewInitial = reducedMotion
    ? { opacity: 0 }
    : { filter: 'blur(4px)', opacity: 0, y: 12 };
  const viewExit = reducedMotion ? { opacity: 0 } : VIEW_EXIT;

  const toggleAuthor = useCallback(
    (handle: string) => {
      void setFilters({ author: author === handle ? null : handle });
    },
    [author, setFilters],
  );

  const gallery = (
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
            error={error}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            onAuthorToggle={toggleAuthor}
            onFocusChange={setFocusedShot}
            selectedAuthor={author}
            shots={shots}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <HomeChrome
      authors={authors}
      density={density}
      favoritesOnly={favorites}
      isCanvas={isCanvas}
      onAuthorToggle={toggleAuthor}
      onDensityChange={(nextDensity) => {
        void setFilters({ density: nextDensity });
      }}
      onFavoritesOnlyChange={(nextFavoritesOnly) => {
        void setFilters({ favorites: nextFavoritesOnly });
      }}
      onSearchChange={(nextSearch) => {
        void setFilters({ search: nextSearch || null });
      }}
      onViewModeChange={(nextViewMode) => {
        setFocusedShot(null);
        void setFilters({ viewMode: nextViewMode });
      }}
      search={search ?? ''}
      selectedAuthor={author}
      shotCount={shotCount}
      viewMode={viewMode}
    >
      {gallery}
      <AnimatePresence>
        {focusedShot ? (
          <ShotFocus
            key={focusedShot.id}
            onAuthorToggle={toggleAuthor}
            onDismiss={() => setFocusedShot(null)}
            selectedAuthor={author}
            shot={focusedShot}
          />
        ) : null}
      </AnimatePresence>
    </HomeChrome>
  );
}
