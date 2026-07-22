import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from 'pickle-ui/text';

const meta = {
  args: {
    children: 'Design inspiration wall',
  },
  component: Text,
  title: 'Components/Text',
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const Lead: Story = {
  args: {
    children: 'Curated shots synced from your bookmark library.',
    variant: 'lead',
  },
};

export const Muted: Story = {
  args: {
    children: 'No shots yet. Sync bookmarks from the companion extension.',
    tone: 'muted',
  },
};

export const Heading: Story = {
  args: {
    as: 'h2',
    children: 'Design inspiration wall',
    variant: 'h2',
  },
};
