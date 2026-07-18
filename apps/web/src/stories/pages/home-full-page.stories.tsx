import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import { HomeFilters } from '@/components/home-filters';
import { HomeHeader } from '@/components/home-header';
import { ShotGallery } from '@/components/shot-gallery';

import { mockAuthors, mockShots } from '../fixtures/shots';

function HomePagePreview() {
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);

  const filteredShots = useMemo(() => {
    return mockShots.filter((shot) => {
      if (favoritesOnly && !shot.isFavorite) {
        return false;
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.trim().toLowerCase();
      return (
        shot.authorHandle.toLowerCase().includes(query) ||
        shot.caption?.toLowerCase().includes(query)
      );
    });
  }, [favoritesOnly, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <HomeHeader
          authors={mockAuthors}
          onAuthorSelect={() => undefined}
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
          shotCount={filteredShots.length}
        />

        <ShotGallery density={density} shots={filteredShots} />
      </main>
    </div>
  );
}

const meta = {
  title: 'Pages/Home/Full page',
  component: HomePagePreview,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HomePagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
