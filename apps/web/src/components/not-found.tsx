import { Link } from '@tanstack/react-router';
import { Bookmark } from 'lucide-react';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card/50">
        <Bookmark className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <Text variant="h3" weight="bold">
          Page not found
        </Text>
        <Text className="max-w-sm" tone="muted">
          The page you were looking for doesn’t exist or has moved.
        </Text>
      </div>
      <Button asChild variant="secondary">
        <Link to="/">Back to library</Link>
      </Button>
    </div>
  );
}
