import type { Shot } from '@signets/shared';

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

import { HomeChrome } from '../components/home-chrome';
import { ShotCanvas } from '../components/shot-canvas';
import { ShotGallery } from '../components/shot-gallery';
import type { ViewMode } from '../components/view-mode-toggle';
import { REDUCED_MOTION_FADE, UI_SPRING, VIEW_EXIT } from '../lib/motion';
import { useInfiniteShots, useShotAuthors } from '../lib/queries';
import { useDebouncedValue } from '../lib/use-debounced-value';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const navigate = useNavigate({ from: '/' });
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);
  const [viewMode, setViewMode] = useState<ViewMode>('wall');
  const [focusedShot, setFocusedShot] = useState<null | Shot>(null);

  const debouncedSearch = useDebouncedValue(search);

  const shotQueryParams = useMemo(
    () => ({
      favorites: favoritesOnly || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch, favoritesOnly],
  );

  const authorQueryParams = useMemo(
    () => ({
      favorites: favoritesOnly || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch, favoritesOnly],
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
      favoritesOnly={favoritesOnly}
      isCanvas={isCanvas}
      onAuthorSelect={(handle) => {
        navigate({ params: { handle }, to: '/authors/$handle' });
      }}
      onDensityChange={setDensity}
      onFavoritesOnlyChange={setFavoritesOnly}
      onSearchChange={setSearch}
      onViewModeChange={setViewMode}
      search={search}
      shotCount={shotCount}
      viewMode={viewMode}
    >
      {gallery}
    </HomeChrome>
  );
}
