import type { Meta, StoryObj } from '@storybook/react-vite';

import { ShotGallery } from '@/features/library/components/shot-gallery';

import { emptyShots, mockShots } from '../fixtures/shots';

const meta = {
  component: ShotGallery,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Features/Library/ShotGallery',
} satisfies Meta<typeof ShotGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    density: 55,
    shots: mockShots,
  },
};

export const Empty: Story = {
  args: {
    density: 55,
    shots: emptyShots,
  },
};

export const Loading: Story = {
  args: {
    density: 55,
    isLoading: true,
    shots: [],
  },
};

export const ApiError: Story = {
  args: {
    density: 55,
    error: new globalThis.Error('API unavailable'),
    shots: [],
  },
};

export const CompactDensity: Story = {
  args: {
    density: 15,
    shots: mockShots.slice(0, 6),
  },
};
