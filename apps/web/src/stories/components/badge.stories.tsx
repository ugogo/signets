import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from 'pickle-ui/badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: {
    children: '12 shots',
  },
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
    variant: 'outline',
    children: 'Favorites',
  },
};
