import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from 'pickle-ui/input';

const meta = {
  args: {
    placeholder: 'Search caption or author',
  },
  component: Input,
  title: 'Components/Input',
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: 'dashboard inspiration',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};
