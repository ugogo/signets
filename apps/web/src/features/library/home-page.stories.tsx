import type { Shot } from '@signets/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';

import type { ViewMode } from '@/features/library/lib/library-search-params';

import { HomeChrome } from '@/features/library/components/home-chrome';
import { ShotCanvas } from '@/features/library/components/shot-canvas';
import { ShotFocus } from '@/features/library/components/shot-focus';
import { ShotGallery } from '@/features/library/components/shot-gallery';

import { mockAuthors, mockShots } from './fixtures/shots';

function HomePagePreview() {
  const [search, setSearch] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<null | string>(null);
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
        onFocusChange={setFocusedShot}
        selectedAuthor={selectedAuthor}
        shots={filteredShots}
      />
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
      canCurate={false}
      curationToken=""
      density={density}
      favoritesOnly={favoritesOnly}
      isCanvas={isCanvas}
      onAuthorToggle={toggleAuthor}
      onClearCurationToken={() => undefined}
      onCopyLink={() => undefined}
      onCurationTokenChange={() => undefined}
      onDensityChange={setDensity}
      onFavoritesOnlyChange={setFavoritesOnly}
      onSaveCurationToken={() => undefined}
      onSearchChange={setSearch}
      onViewModeChange={setViewMode}
      search={search}
      selectedAuthor={selectedAuthor}
      shotCount={filteredShots.length}
      viewMode={viewMode}
    >
      {gallery}
      <AnimatePresence>
        {focusedShot ? (
          <ShotFocus
            key={focusedShot.id}
            onAuthorToggle={toggleAuthor}
            onDismiss={() => setFocusedShot(null)}
            selectedAuthor={selectedAuthor}
            shot={focusedShot}
          />
        ) : null}
      </AnimatePresence>
    </HomeChrome>
  );
}

const meta = {
  component: HomePagePreview,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Features/Library/Home page',
} satisfies Meta<typeof HomePagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
