import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from 'pickle-ui/badge';

const meta = {
  args: {
    children: '12 shots',
  },
  component: Badge,
  title: 'Components/Badge',
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Default: Story = {};

export const Outline: Story = {
  args: {
    children: 'Favorites',
    variant: 'outline',
  },
};
