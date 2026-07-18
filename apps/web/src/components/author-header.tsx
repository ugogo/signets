import { Link } from '@tanstack/react-router';
import { Input } from 'pickle-ui/input';

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
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          to="/"
        >
          ← Back to library
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          @{authorHandle}
        </h1>
      </div>
      <div className="w-full sm:max-w-sm">
        <Input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search within this author"
          value={search}
        />
      </div>
    </div>
  );
}
