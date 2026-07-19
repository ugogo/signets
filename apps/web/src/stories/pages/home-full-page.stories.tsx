import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import type { Shot } from '@signets/shared';

import { HomeChrome } from '@/components/home-chrome';
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

  const isCanvas = viewMode === 'canvas';

  const gallery =
    viewMode === 'wall' ? (
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
    );

  return (
    <HomeChrome
      authors={mockAuthors}
      density={density}
      favoritesOnly={favoritesOnly}
      isCanvas={isCanvas}
      onAuthorSelect={() => undefined}
      onDensityChange={setDensity}
      onFavoritesOnlyChange={setFavoritesOnly}
      onSearchChange={setSearch}
      onViewModeChange={setViewMode}
      search={search}
      shotCount={filteredShots.length}
      viewMode={viewMode}
    >
      {gallery}
    </HomeChrome>
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
