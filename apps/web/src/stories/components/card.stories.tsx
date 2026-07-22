import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from 'pickle-ui/card';
import { Text } from 'pickle-ui/text';

function ExampleCard() {
  return (
    <Card className="max-w-sm">
      <Card.Header>
        <Card.Title>Design inspiration wall</Card.Title>
        <Card.Description>
          Curated shots synced from your bookmark library.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Text tone="muted">12 shots from 4 authors</Text>
      </Card.Content>
    </Card>
  );
}

const meta = {
  component: ExampleCard,
  title: 'Components/Card',
} satisfies Meta<typeof ExampleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DashedEmpty: Story = {
  render: () => (
    <Card className="max-w-lg border-dashed p-12 text-center">
      <Text tone="muted">
        No shots yet. Sync bookmarks from the companion extension.
      </Text>
    </Card>
  ),
};
