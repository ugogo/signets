import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { HomeHeader } from '@/components/home-header';

import { mockAuthors } from '../fixtures/shots';

function HomeHeaderPreview({
  initialAuthor = '',
  initialSearch = '',
}: {
  initialAuthor?: string;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [author, setAuthor] = useState(initialAuthor);

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <HomeHeader
        author={author}
        authors={mockAuthors}
        onAuthorChange={setAuthor}
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

export const WithFiltersApplied: Story = {
  args: {
    initialAuthor: 'designstudio',
    initialSearch: 'dashboard',
  },
};
