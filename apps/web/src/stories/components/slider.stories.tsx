import type { Meta, StoryObj } from '@storybook/react-vite';

import { Slider } from 'pickle-ui/slider';

const meta = {
  args: {
    className: 'w-64',
    defaultValue: [55],
    max: 100,
    min: 0,
  },
  component: Slider,
  title: 'Components/Slider',
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LowDensity: Story = {
  args: {
    defaultValue: [20],
  },
};

export const HighDensity: Story = {
  args: {
    defaultValue: [85],
  },
};
