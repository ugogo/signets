import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { AuthorHeader } from '../../components/author-header';
import { HomeFilters } from '../../components/home-filters';
import { ShotGallery } from '../../components/shot-gallery';
import { useInfiniteShots } from '../../lib/queries';
import { useDebouncedValue } from '../../lib/use-debounced-value';

export const Route = createFileRoute('/authors/$handle')({
  component: AuthorPage,
});

function AuthorPage() {
  const { handle } = Route.useParams();
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <AuthorHeader
          authorHandle={handle}
          onSearchChange={setSearch}
          search={search}
        />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <HomeFilters
          density={density}
          favoritesOnly={favoritesOnly}
          onDensityChange={setDensity}
          onFavoritesOnlyChange={setFavoritesOnly}
          shotCount={shotCount}
        />

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
      </main>
    </div>
  );
}
