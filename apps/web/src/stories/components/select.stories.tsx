import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from 'pickle-ui/select';

import { mockAuthors } from '../fixtures/shots';

function AuthorSelect({ value = '' }: { value?: string }) {
  return (
    <Select value={value || null}>
      <Select.Trigger className="w-64">
        <Select.Value placeholder="All authors" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="">All authors</Select.Item>
        {mockAuthors.map((handle) => (
          <Select.Item key={handle} value={handle}>
            @{handle}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}

const meta = {
  title: 'Components/Select',
  component: AuthorSelect,
} satisfies Meta<typeof AuthorSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: {
    value: 'designstudio',
  },
};
