import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from 'pickle-ui/checkbox';

const meta = {
  args: {
    label: 'Favorites only',
  },
  component: Checkbox,
  title: 'Components/Checkbox',
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
