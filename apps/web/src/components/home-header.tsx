import { Input } from 'pickle-ui/input';
import { Select } from 'pickle-ui/select';

export interface HomeHeaderProps {
  author: string;
  authors: string[];
  onAuthorChange: (author: string) => void;
  onSearchChange: (search: string) => void;
  search: string;
}

export function HomeHeader({
  author,
  authors,
  onAuthorChange,
  onSearchChange,
  search,
}: HomeHeaderProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Signets
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Design inspiration wall
        </h1>
      </div>
      <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
        <Input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search caption or author"
          value={search}
        />
        <Select
          onValueChange={(value) =>
            onAuthorChange(typeof value === 'string' ? value : '')
          }
          value={author || null}
        >
          <Select.Trigger className="w-full">
            <Select.Value placeholder="All authors" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">All authors</Select.Item>
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
