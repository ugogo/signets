import type { Shot } from '@signets/shared';

import { Card } from 'pickle-ui/card';
import { Text } from 'pickle-ui/text';
import { useMemo } from 'react';

import { xThumbnailUrl } from '../lib/api';

interface GalleryProps {
  density: number;
  error?: Error | null;
  isLoading?: boolean;
  shots: Shot[];
}

export function ShotGallery({
  density,
  error = null,
  isLoading = false,
  shots,
}: GalleryProps) {
  const columnWidth = useMemo(() => {
    const min = 120;
    const max = 420;
    return Math.round(min + ((max - min) * density) / 100);
  }, [density]);

  if (isLoading) {
    return <Text tone="muted">Loading library…</Text>;
  }

  if (error) {
    return (
      <Text className="text-destructive">
        Could not reach the API. Start the NestJS server on port 3001.
      </Text>
    );
  }

  if (shots.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <Text tone="muted">
          No shots yet. Sync bookmarks from the companion extension.
        </Text>
      </Card>
    );
  }

  return (
    <div
      className="gap-3"
      style={{
        columnCount: 'auto',
        columnWidth: `${columnWidth}px`,
      }}
    >
      {shots.map((shot) => (
        <Card
          className="mb-3 break-inside-avoid overflow-hidden shadow-sm"
          key={shot.id}
        >
          <a
            className="block"
            href={`https://x.com/i/web/status/${shot.xPostId}`}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={shot.caption ?? `@${shot.authorHandle} design shot`}
              className="block w-full bg-background object-cover"
              loading="lazy"
              src={xThumbnailUrl(
                shot.imageUrl,
                density < 35 ? 'small' : 'medium',
              )}
            />
          </a>
          <Card.Content className="space-y-1 px-3 py-2 text-sm">
            <Text weight="bold">@{shot.authorHandle}</Text>
            {shot.caption ? (
              <Text className="line-clamp-2" tone="muted">
                {shot.caption}
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
