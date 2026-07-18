import { Link } from '@tanstack/react-router';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <Text variant="large" weight="bold">
        Page not found
      </Text>
      <Text tone="muted">
        The page you were looking for doesn’t exist or has moved.
      </Text>
      <Button asChild variant="secondary">
        <Link to="/">Back to library</Link>
      </Button>
    </div>
  );
}
