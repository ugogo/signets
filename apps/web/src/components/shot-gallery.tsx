import type { Shot } from '@signets/shared';

import { Card } from 'pickle-ui/card';
import { Text } from 'pickle-ui/text';
import { useCallback, useMemo } from 'react';

import { xThumbnailUrl } from '../lib/api';
import { useInfiniteScrollSentinel } from '../lib/use-infinite-scroll-sentinel';

const FALLBACK_ASPECT_RATIO = '4 / 5';

interface GalleryProps {
  density: number;
  emptyMessage?: string;
  error?: Error | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  shots: Shot[];
}

export function ShotGallery({
  density,
  emptyMessage = 'No shots yet. Sync bookmarks from the companion extension.',
  error = null,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  isLoading = false,
  shots,
}: GalleryProps) {
  const columnWidth = useMemo(() => {
    const min = 120;
    const max = 420;
    return Math.round(min + ((max - min) * density) / 100);
  }, [density]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const sentinelRef = useInfiniteScrollSentinel(
    hasNextPage && !isFetchingNextPage,
    loadMore,
  );

  if (isLoading && shots.length === 0) {
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
        <Text tone="muted">{emptyMessage}</Text>
      </Card>
    );
  }

  return (
    <>
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
              <div
                className="w-full bg-background"
                style={{
                  aspectRatio:
                    shot.width && shot.height
                      ? `${shot.width} / ${shot.height}`
                      : FALLBACK_ASPECT_RATIO,
                }}
              >
                <img
                  alt={shot.caption ?? `@${shot.authorHandle} design shot`}
                  className="block h-full w-full object-cover"
                  decoding="async"
                  height={shot.height ?? undefined}
                  loading="lazy"
                  src={xThumbnailUrl(shot.imageUrl, 'medium')}
                  width={shot.width ?? undefined}
                />
              </div>
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
      <div aria-hidden className="h-px w-full" ref={sentinelRef} />
      {isFetchingNextPage ? (
        <Text className="mt-4 text-center" tone="muted">
          Loading more…
        </Text>
      ) : null}
    </>
  );
}
