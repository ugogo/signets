import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from 'pickle-ui/text';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: {
    children: 'Design inspiration wall',
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const Lead: Story = {
  args: {
    variant: 'lead',
    children: 'Curated shots synced from your bookmark library.',
  },
};

export const Muted: Story = {
  args: {
    tone: 'muted',
    children: 'No shots yet. Sync bookmarks from the companion extension.',
  },
};

export const Heading: Story = {
  args: {
    as: 'h2',
    variant: 'h2',
    children: 'Design inspiration wall',
  },
};
