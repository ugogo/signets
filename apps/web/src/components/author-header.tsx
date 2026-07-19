import { Link } from '@tanstack/react-router';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from 'pickle-ui/button';

import { Input, InputGroup } from './input-group';
import { ThemeToggle } from './theme-toggle';

export interface AuthorHeaderProps {
  authorHandle: string;
  onSearchChange: (search: string) => void;
  search: string;
}

export function AuthorHeader({
  authorHandle,
  onSearchChange,
  search,
}: AuthorHeaderProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Library
          </Link>
        </Button>
        <div>
          <p className="eyebrow-label">Author</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">@{authorHandle}</h1>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:max-w-sm">
        <InputGroup className="flex-1">
          <InputGroup.Addon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroup.Addon>
          <Input
            aria-label="Search within this author"
            className="touch-input"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search within this author"
            value={search}
          />
        </InputGroup>
        <ThemeToggle />
      </div>
    </div>
  );
}
