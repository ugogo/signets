import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { HomeHeader } from '@/components/home-header';

import { mockAuthors } from '../fixtures/shots';

function HomeHeaderPreview({ initialSearch = '' }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <HomeHeader
        authors={mockAuthors}
        onAuthorSelect={() => undefined}
        onSearchChange={setSearch}
        search={search}
      />
    </header>
  );
}

const meta = {
  title: 'Pages/Home/Header',
  component: HomeHeaderPreview,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HomeHeaderPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearchApplied: Story = {
  args: {
    initialSearch: 'dashboard',
  },
};
