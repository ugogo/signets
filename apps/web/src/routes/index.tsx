import type { Shot } from '@signets/shared';

import { createFileRoute, redirect } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQueryStates } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import { LibraryShell } from '@/features/library/components/library-shell';
import { ShotCanvas } from '@/features/library/components/shot-canvas';
import { ShotDetailDialog } from '@/features/library/components/shot-detail-dialog';
import { ShotGallery } from '@/features/library/components/shot-gallery';
import {
  librarySearchParams,
  librarySearchSchema,
} from '@/features/library/lib/library-search-params';
import {
  useInfiniteShots,
  useShotAuthors,
} from '@/features/library/lib/queries';
import {
  useDeleteShot,
  useToggleShotFavorite,
} from '@/features/library/lib/shot-mutations';
import { getSession } from '@/lib/auth-client';
import { REDUCED_MOTION_FADE, UI_SPRING, VIEW_EXIT } from '@/lib/motion';
import { useDebouncedValue } from '@/lib/use-debounced-value';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Session cookies live on the API origin; skip SSR checks on the web worker.
    if (typeof window === 'undefined') {
      return;
    }

    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: Home,
  validateSearch: librarySearchSchema,
});

function Home() {
  const [filters, setFilters] = useQueryStates(librarySearchParams);
  const { author, density, favorites, search, viewMode } = filters;
  const [focusedShot, setFocusedShot] = useState<null | Shot>(null);
  const toggleFavorite = useToggleShotFavorite();
  const deleteShot = useDeleteShot();

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
  const wallTransition = REDUCED_MOTION_FADE;
  const wallInitial = { opacity: 0 };
  const wallAnimate = { opacity: 1 };
  const wallExit = { opacity: 0 };

  const toggleAuthor = useCallback(
    (handle: string) => {
      void setFilters({ author: author === handle ? null : handle });
    },
    [author, setFilters],
  );

  const handleToggleFavorite = useCallback(
    (shot: Shot) => {
      toggleFavorite.mutate(shot.id, {
        onSuccess: (updatedShot) => {
          setFocusedShot((current) =>
            current?.id === updatedShot.id ? updatedShot : current,
          );
        },
      });
    },
    [toggleFavorite],
  );

  const handleDeleteFocusedShot = useCallback(() => {
    if (!focusedShot) {
      return;
    }

    deleteShot.mutate(focusedShot.id, {
      onSuccess: () => {
        setFocusedShot(null);
      },
    });
  }, [deleteShot, focusedShot]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

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
            fetchNextPage={handleFetchNextPage}
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
          animate={wallAnimate}
          exit={wallExit}
          initial={wallInitial}
          key="wall"
          transition={wallTransition}
        >
          <ShotGallery
            density={density}
            error={error}
            favoritePendingShotId={
              toggleFavorite.isPending ? toggleFavorite.variables : null
            }
            fetchNextPage={handleFetchNextPage}
            hasNextPage={hasNextPage}
            isCurator
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            onAuthorToggle={toggleAuthor}
            onFocusChange={setFocusedShot}
            onToggleFavorite={handleToggleFavorite}
            selectedAuthor={author}
            shots={shots}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <LibraryShell
      authors={authors}
      density={density}
      favoritesOnly={favorites}
      onAuthorToggle={toggleAuthor}
      onCopyLink={() => {
        void handleCopyLink();
      }}
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
      selectedAuthor={author ?? null}
      shotCount={shotCount}
      viewMode={viewMode}
    >
      {gallery}
      <AnimatePresence>
        {focusedShot ? (
          <ShotDetailDialog
            favoritePendingShotId={
              toggleFavorite.isPending ? toggleFavorite.variables : null
            }
            isCurator
            isDeleting={deleteShot.isPending}
            key={focusedShot.id}
            onAuthorToggle={toggleAuthor}
            onDelete={handleDeleteFocusedShot}
            onDismiss={() => setFocusedShot(null)}
            onToggleFavorite={() => handleToggleFavorite(focusedShot)}
            selectedAuthor={author}
            shot={focusedShot}
          />
        ) : null}
      </AnimatePresence>
    </LibraryShell>
  );
}
