import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { ShotGallery } from '../components/shot-gallery';
import { useShots } from '../lib/queries';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);

  const queryParams = useMemo(
    () => ({
      author: author.trim() || undefined,
      favorites: favoritesOnly || undefined,
      search: search.trim() || undefined,
    }),
    [search, author, favoritesOnly],
  );

  const { data: shots = [], error, isLoading } = useShots(queryParams);

  const authors = useMemo(() => {
    const handles = new Set(shots.map((shot) => shot.authorHandle));
    return [...handles].sort();
  }, [shots]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Signets
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Design inspiration wall
            </h1>
          </div>
          <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
            <input
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-zinc-500 focus:ring"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search caption or author"
              value={search}
            />
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-zinc-500 focus:ring"
              onChange={(event) => setAuthor(event.target.value)}
              value={author}
            >
              <option value="">All authors</option>
              {authors.map((handle) => (
                <option key={handle} value={handle}>
                  @{handle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              checked={favoritesOnly}
              className="rounded border-zinc-600 bg-zinc-900"
              onChange={(event) => setFavoritesOnly(event.target.checked)}
              type="checkbox"
            />
            Favorites only
          </label>
          <label className="flex min-w-48 flex-1 items-center gap-3 text-sm text-zinc-300">
            <span>Density</span>
            <input
              className="w-full"
              max={100}
              min={0}
              onChange={(event) => setDensity(Number(event.target.value))}
              type="range"
              value={density}
            />
          </label>
          <p className="text-sm text-zinc-500">{shots.length} shots</p>
        </div>

        {isLoading ? (
          <p className="text-zinc-400">Loading library…</p>
        ) : error ? (
          <p className="text-red-300">
            Could not reach the API. Start the NestJS server on port 3001.
          </p>
        ) : (
          <ShotGallery density={density} shots={shots} />
        )}
      </main>
    </div>
  );
}
