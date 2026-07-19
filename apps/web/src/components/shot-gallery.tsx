import type { Shot } from '@signets/shared';

import { BookmarkPlus, Star } from 'lucide-react';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';
import { useCallback, useMemo } from 'react';

import { xThumbnailUrl } from '../lib/api';
import { useInfiniteScrollSentinel } from '../lib/use-infinite-scroll-sentinel';
import { cn } from '../lib/utils';
import { MediaCard, SurfaceCard } from './media-card';

const FALLBACK_ASPECT_RATIO = '4 / 5';

interface GalleryProps {
  density: number;
  emptyMessage?: string;
  error?: Error | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onAuthorToggle?: (authorHandle: string) => void;
  selectedAuthor?: string | null;
  shots: Shot[];
}

function GallerySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="h-48 animate-pulse rounded-lg bg-muted/40"
            key={index}
            style={{ width: `${140 + (index % 3) * 40}px` }}
          />
        ))}
      </div>
      <Text tone="muted" variant="small">
        Loading library…
      </Text>
    </div>
  );
}

function EmptyLibrary({ message }: { message: string }) {
  return (
    <SurfaceCard className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/40 shadow-(--shadow-border)">
        <BookmarkPlus className="size-5 text-muted-foreground" />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <Text weight="bold">Nothing here yet</Text>
        <Text tone="muted">{message}</Text>
      </div>
    </SurfaceCard>
  );
}

function ShotCard({
  onAuthorToggle,
  selectedAuthor,
  shot,
}: {
  onAuthorToggle?: (authorHandle: string) => void;
  selectedAuthor?: string | null;
  shot: Shot;
}) {
  const authorActive = selectedAuthor === shot.authorHandle;

  return (
    <article className="group relative mb-3 break-inside-avoid">
      <MediaCard className="press-scale relative block overflow-hidden rounded-xl transition-[box-shadow,transform] duration-200 ease-out hover:shadow-(--shadow-border-hover) hover-fine:-translate-y-0.5">
        <a
          className="block"
          href={`https://x.com/i/web/status/${shot.xPostId}`}
          rel="noreferrer"
          target="_blank"
        >
          <div
            className="w-full bg-muted/20"
            style={{
              aspectRatio:
                shot.width && shot.height
                  ? `${shot.width} / ${shot.height}`
                  : FALLBACK_ASPECT_RATIO,
            }}
          >
            <img
              alt={shot.caption ?? `@${shot.authorHandle} design shot`}
              className="block h-full w-full object-cover transition-transform duration-200 ease-out hover-fine:group-hover:scale-[1.02]"
              decoding="async"
              height={shot.height ?? undefined}
              loading="lazy"
              src={xThumbnailUrl(shot.imageUrl, 'medium')}
              width={shot.width ?? undefined}
            />
          </div>
        </a>

        {shot.isFavorite ? (
          <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <Star className="size-3.5 fill-primary text-primary" />
          </span>
        ) : null}

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-t from-background/95 via-background/70 to-transparent px-3 pb-3 pt-10',
            'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
            'group-focus-within:opacity-100',
          )}
        >
          <Button
            aria-pressed={authorActive}
            className={cn(
              'h-auto w-fit rounded-md p-0 font-mono text-xs font-bold',
              authorActive
                ? 'text-primary'
                : 'text-foreground hover:text-primary',
            )}
            onClick={() => onAuthorToggle?.(shot.authorHandle)}
            size="sm"
            variant="ghost"
          >
            @{shot.authorHandle}
          </Button>
          {shot.caption ? (
            <Text className="line-clamp-2 text-xs" tone="muted" variant="small">
              {shot.caption}
            </Text>
          ) : null}
        </div>
      </MediaCard>
    </article>
  );
}

export function ShotGallery({
  density,
  emptyMessage = 'No shots yet. Sync bookmarks from the companion extension.',
  error = null,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  isLoading = false,
  onAuthorToggle,
  selectedAuthor = null,
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
    return <GallerySkeleton />;
  }

  if (error) {
    return (
      <Text className="text-destructive">
        Could not reach the API. Start the NestJS server on port 3001.
      </Text>
    );
  }

  if (shots.length === 0) {
    return <EmptyLibrary message={emptyMessage} />;
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
          <ShotCard
            key={shot.id}
            onAuthorToggle={onAuthorToggle}
            selectedAuthor={selectedAuthor}
            shot={shot}
          />
        ))}
      </div>
      <div aria-hidden className="h-px w-full" ref={sentinelRef} />
      {isFetchingNextPage ? (
        <Text className="mt-6 text-center font-mono text-xs tabular-nums" tone="muted">
          Loading more…
        </Text>
      ) : null}
    </>
  );
}
