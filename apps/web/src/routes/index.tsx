import type { Shot } from '@signets/shared';

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { HomeFilters } from '../components/home-filters';
import { HomeHeader } from '../components/home-header';
import { ShotCanvas } from '../components/shot-canvas';
import { ShotGallery } from '../components/shot-gallery';
import type { ViewMode } from '../components/view-mode-toggle';
import { useInfiniteShots, useShotAuthors } from '../lib/queries';
import { useDebouncedValue } from '../lib/use-debounced-value';
import { cn } from '../lib/utils';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
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

  return (
    <div
      className={cn(
        'bg-background text-foreground',
        isCanvas ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-screen',
      )}
    >
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <HomeHeader
          authors={authors}
          onAuthorSelect={(handle) => {
            navigate({ params: { handle }, to: '/authors/$handle' });
          }}
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

        {isCanvas ? (
          <div className="min-h-0 flex-1">
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
          </div>
        ) : (
          <ShotGallery
            density={density}
            error={error}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            shots={shots}
          />
        )}
      </main>
    </div>
  );
}
