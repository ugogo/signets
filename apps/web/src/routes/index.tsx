import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { HomeFilters } from '../components/home-filters';
import { HomeHeader } from '../components/home-header';
import { ShotGallery } from '../components/shot-gallery';
import { useShots } from '../lib/queries';
import { useDebouncedValue } from '../lib/use-debounced-value';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);

  const debouncedSearch = useDebouncedValue(search);

  const queryParams = useMemo(
    () => ({
      author: author.trim() || undefined,
      favorites: favoritesOnly || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch, author, favoritesOnly],
  );

  const { data: shots = [], error, isLoading } = useShots(queryParams);

  const authors = useMemo(() => {
    const handles = new Set(shots.map((shot) => shot.authorHandle));
    return [...handles].sort();
  }, [shots]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <HomeHeader
          author={author}
          authors={authors}
          onAuthorChange={setAuthor}
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
          shotCount={shots.length}
        />

        <ShotGallery
          density={density}
          error={error}
          isLoading={isLoading}
          shots={shots}
        />
      </main>
    </div>
  );
}
