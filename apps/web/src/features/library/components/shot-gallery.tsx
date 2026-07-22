import type { Shot } from '@signets/shared';

import { BookmarkPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Text } from 'pickle-ui/text';
import { useCallback, useMemo } from 'react';

import { OPACITY_CROSSFADE } from '@/lib/motion';
import { useInfiniteScrollSentinel } from '@/lib/use-infinite-scroll-sentinel';

import { LibraryEmptyState } from './library-empty-state';
import { LibraryErrorMessage } from './library-error-message';
import { ShotCard } from './shot-card';

export interface ShotGalleryProps {
  density: number;
  emptyMessage?: string;
  error?: Error | null;
  favoritePendingShotId?: null | string;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isCurator?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onAuthorToggle?: (authorHandle: string) => void;
  onFocusChange?: (shot: Shot) => void;
  onToggleFavorite?: (shot: Shot) => void;
  selectedAuthor?: null | string;
  shots: Shot[];
}

export function ShotGallery({
  density,
  emptyMessage = 'No shots yet. Sync bookmarks from the companion extension.',
  error = null,
  favoritePendingShotId = null,
  fetchNextPage,
  hasNextPage = false,
  isCurator = false,
  isFetchingNextPage = false,
  isLoading = false,
  onAuthorToggle,
  onFocusChange,
  onToggleFavorite,
  selectedAuthor = null,
  shots,
}: ShotGalleryProps) {
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

  const viewKey =
    isLoading && shots.length === 0
      ? 'loading'
      : error
        ? 'error'
        : shots.length === 0
          ? 'empty'
          : 'content';

  return (
    <AnimatePresence mode="wait">
      {viewKey === 'loading' ? (
        <motion.div key="loading" {...OPACITY_CROSSFADE}>
          <GallerySkeleton />
        </motion.div>
      ) : null}
      {viewKey === 'error' ? (
        <motion.div key="error" {...OPACITY_CROSSFADE}>
          <LibraryErrorMessage />
        </motion.div>
      ) : null}
      {viewKey === 'empty' ? (
        <motion.div key="empty" {...OPACITY_CROSSFADE}>
          <LibraryEmptyState
            icon={
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/40 shadow-(--shadow-border)">
                <BookmarkPlus className="size-5 text-muted-foreground" />
              </div>
            }
            message={emptyMessage}
          />
        </motion.div>
      ) : null}
      {viewKey === 'content' ? (
        <motion.div key="content" {...OPACITY_CROSSFADE}>
          <div
            className="gap-3"
            style={{
              columnCount: 'auto',
              columnWidth: `${columnWidth}px`,
            }}
          >
            {shots.map((shot) => (
              <ShotCard
                favoritePendingShotId={favoritePendingShotId}
                isCurator={isCurator}
                key={shot.id}
                onAuthorToggle={onAuthorToggle}
                onFocusChange={onFocusChange}
                onToggleFavorite={onToggleFavorite}
                selectedAuthor={selectedAuthor}
                shot={shot}
              />
            ))}
          </div>
          <div aria-hidden className="h-px w-full" ref={sentinelRef} />
          {isFetchingNextPage ? (
            <Text
              className="mt-6 text-center font-mono text-xs tabular-nums"
              tone="muted"
            >
              Loading more…
            </Text>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
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
