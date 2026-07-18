import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { HomeFilters } from '@/components/home-filters';
import type { ViewMode } from '@/components/view-mode-toggle';

function HomeFiltersPreview({
  initialDensity = 55,
  initialFavoritesOnly = false,
  initialViewMode = 'wall',
  shotCount = 10,
}: {
  initialDensity?: number;
  initialFavoritesOnly?: boolean;
  initialViewMode?: ViewMode;
  shotCount?: number;
}) {
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const [density, setDensity] = useState(initialDensity);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  return (
    <HomeFilters
      density={density}
      favoritesOnly={favoritesOnly}
      onDensityChange={setDensity}
      onFavoritesOnlyChange={setFavoritesOnly}
      onViewModeChange={setViewMode}
      shotCount={shotCount}
      viewMode={viewMode}
    />
  );
}

const meta = {
  title: 'Pages/Home/Filters',
  component: HomeFiltersPreview,
} satisfies Meta<typeof HomeFiltersPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FavoritesEnabled: Story = {
  args: {
    initialDensity: 72,
    initialFavoritesOnly: true,
    shotCount: 4,
  },
};

export const CanvasMode: Story = {
  args: {
    initialViewMode: 'canvas',
  },
};
