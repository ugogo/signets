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
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(55);
  const [viewMode, setViewMode] = useState<ViewMode>('wall');
  const [focusedShot, setFocusedShot] = useState<null | Shot>(null);

  const filteredShots = useMemo(() => {
    return mockShots.filter((shot) => {
      if (selectedAuthor && shot.authorHandle !== selectedAuthor) {
        return false;
      }

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
  }, [favoritesOnly, search, selectedAuthor]);

  const toggleAuthor = (handle: string) => {
    setSelectedAuthor((current) => (current === handle ? null : handle));
  };

  const isCanvas = viewMode === 'canvas';

  const gallery =
    viewMode === 'wall' ? (
      <ShotGallery
        density={density}
        onAuthorToggle={toggleAuthor}
        selectedAuthor={selectedAuthor}
        shots={filteredShots}
      />
    ) : (
      <div className="h-[70vh]">
        <ShotCanvas
          focusedShot={focusedShot}
          onAuthorToggle={toggleAuthor}
          onFocusChange={setFocusedShot}
          selectedAuthor={selectedAuthor}
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
      onAuthorToggle={toggleAuthor}
      onDensityChange={setDensity}
      onFavoritesOnlyChange={setFavoritesOnly}
      onSearchChange={setSearch}
      onViewModeChange={setViewMode}
      search={search}
      selectedAuthor={selectedAuthor}
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
