import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import type { Shot } from '@signets/shared';

import { HomeFilters } from '@/components/home-filters';
import { HomeHeader } from '@/components/home-header';
import { ShotCanvas } from '@/components/shot-canvas';
import { ShotGallery } from '@/components/shot-gallery';
import type { ViewMode } from '@/components/view-mode-toggle';

import { mockAuthors, mockShots } from '../fixtures/shots';

function HomePagePreview() {
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);
  const [viewMode, setViewMode] = useState<ViewMode>('wall');
  const [focusedShot, setFocusedShot] = useState<null | Shot>(null);

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
          onViewModeChange={setViewMode}
          shotCount={filteredShots.length}
          viewMode={viewMode}
        />

        {viewMode === 'wall' ? (
          <ShotGallery density={density} shots={filteredShots} />
        ) : (
          <div className="h-[70vh]">
            <ShotCanvas
              focusedShot={focusedShot}
              onFocusChange={setFocusedShot}
              shots={filteredShots}
              total={filteredShots.length}
            />
          </div>
        )}
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
