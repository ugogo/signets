import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { HomeFilters } from '@/components/home-filters';

function HomeFiltersPreview({
  initialDensity = 55,
  initialFavoritesOnly = false,
  shotCount = 10,
}: {
  initialDensity?: number;
  initialFavoritesOnly?: boolean;
  shotCount?: number;
}) {
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const [density, setDensity] = useState(initialDensity);

  return (
    <HomeFilters
      density={density}
      favoritesOnly={favoritesOnly}
      onDensityChange={setDensity}
      onFavoritesOnlyChange={setFavoritesOnly}
      shotCount={shotCount}
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
