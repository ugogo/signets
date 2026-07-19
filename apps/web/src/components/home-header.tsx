import { Bookmark, Search, Users } from 'lucide-react';
import { Input } from 'pickle-ui/input';
import { InputGroup } from 'pickle-ui/input-group';
import { Select } from 'pickle-ui/select';

export interface HomeHeaderProps {
  authors: string[];
  onAuthorSelect: (authorHandle: string) => void;
  onSearchChange: (search: string) => void;
  search: string;
}

export function HomeHeader({
  authors,
  onAuthorSelect,
  onSearchChange,
  search,
}: HomeHeaderProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bookmark className="size-3.5" />
          <p className="font-mono text-[11px] uppercase tracking-[0.24em]">
            Signets
          </p>
        </div>
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Design library
          </h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Saved X bookmarks, browsable as shots for product inspiration.
          </p>
        </div>
      </div>

      <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
        <InputGroup>
          <InputGroup.Addon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroup.Addon>
          <Input
            aria-label="Search caption or author"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search caption or author"
            value={search}
          />
        </InputGroup>

        <Select
          onValueChange={(value) => {
            const handle = typeof value === 'string' ? value : '';
            if (handle) {
              onAuthorSelect(handle);
            }
          }}
          value={null}
        >
          <Select.Trigger aria-label="Filter by author" className="w-full">
            <Users className="size-4 text-muted-foreground" />
            <Select.Value placeholder="All authors" />
          </Select.Trigger>
          <Select.Content>
            {authors.map((handle) => (
              <Select.Item key={handle} value={handle}>
                @{handle}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    </div>
  );
}
