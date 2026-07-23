import type { Shot } from '@signets/shared';

import { BookmarkPlus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';
import { useMemo, useRef } from 'react';

import {
  columnsForWidth,
  FALLBACK_ASPECT,
  packIntoColumns,
} from '@/features/library/lib/masonry';
import { useElementSize } from '@/features/library/lib/use-element-size';
import {
  OPACITY_CROSSFADE,
  WALL_ENTRANCE_SPRING,
  WALL_ITEM_VARIANTS,
  WALL_MAX_STAGGER_DELAY,
  WALL_REDUCED_MOTION_FADE,
  WALL_STAGGER_DELAY,
} from '@/lib/motion';

import { LibraryEmptyState } from './library-empty-state';
import { LibraryErrorMessage } from './library-error-message';
import { ShotCard } from './shot-card';

/** Matches Tailwind `gap-3` used between wall columns and cards. */
const GAP = 12;

/** Last measured wall width — reused before ResizeObserver commits. */
let lastWallWidth: null | number = null;

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
  const reducedMotion = useReducedMotion() ?? false;
  const columnWidth = useMemo(() => {
    const min = 120;
    const max = 420;
    return Math.round(min + ((max - min) * density) / 100);
  }, [density]);

  const [containerRef, size] = useElementSize();

  const columnCount = useMemo(() => {
    // Prefer measured width; fall back to the last known wall width (then
    // viewport) so the first paint is close before ResizeObserver commits.
    if (size?.width) {
      lastWallWidth = size.width;
    }
    const width =
      size?.width ??
      lastWallWidth ??
      (typeof window !== 'undefined' ? window.innerWidth : columnWidth);
    return Math.max(1, columnsForWidth(width, columnWidth, GAP));
  }, [columnWidth, size]);

  const columns = useMemo(() => {
    const width =
      size?.width ??
      lastWallWidth ??
      (typeof window !== 'undefined' ? window.innerWidth : columnWidth);
    const packedWidth =
      columnCount > 0
        ? (width - GAP * (columnCount - 1)) / columnCount
        : columnWidth;
    const aspects = shots.map((shot) =>
      shot.width && shot.height ? shot.width / shot.height : FALLBACK_ASPECT,
    );
    const packed = packIntoColumns(aspects, columnCount, packedWidth, GAP);
    return packed.map((indices) =>
      indices.map((index) => ({ index, shot: shots[index] })),
    );
  }, [columnCount, columnWidth, shots, size?.width]);

  // Track tiles that have already played their entrance so re-renders
  // (ResizeObserver, density, etc.) do not cancel in-flight stagger.
  const listIdentity = shots[0]?.id ?? '';
  const enteredIdsRef = useRef(new Set<string>());
  const listIdentityRef = useRef(listIdentity);
  if (listIdentityRef.current !== listIdentity) {
    listIdentityRef.current = listIdentity;
    enteredIdsRef.current = new Set();
  }
  const enteredBeforeBatchRef = useRef(enteredIdsRef.current.size);
  const batchStart = enteredBeforeBatchRef.current;
  enteredBeforeBatchRef.current = enteredIdsRef.current.size;

  const staggerDelays = useMemo(() => {
    const delays = new Map<string, number>();
    let sequence = 0;
    for (const columnShots of columns) {
      for (const { index, shot } of columnShots) {
        if (index >= batchStart) {
          delays.set(
            shot.id,
            Math.min(sequence * WALL_STAGGER_DELAY, WALL_MAX_STAGGER_DELAY),
          );
          sequence += 1;
        }
      }
    }
    return delays;
  }, [batchStart, columns]);

  const markEntered = (shotId: string) => {
    enteredIdsRef.current.add(shotId);
  };

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
          <GallerySkeleton columnCount={columnCount} gridRef={containerRef} />
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
        <div key="content">
          <div className="flex gap-3" ref={containerRef}>
            {columns.map((columnShots, columnIndex) => (
              <div
                className="flex min-w-0 flex-1 flex-col gap-3"
                key={columnIndex}
              >
                {columnShots.map(({ shot }) => {
                  const shouldAnimate = !enteredIdsRef.current.has(shot.id);
                  const delay =
                    !shouldAnimate || reducedMotion
                      ? 0
                      : (staggerDelays.get(shot.id) ?? 0);

                  return (
                    <motion.div
                      animate={
                        reducedMotion
                          ? { opacity: 1 }
                          : WALL_ITEM_VARIANTS.visible
                      }
                      initial={
                        shouldAnimate
                          ? reducedMotion
                            ? { opacity: 0 }
                            : WALL_ITEM_VARIANTS.hidden
                          : false
                      }
                      key={shot.id}
                      onAnimationComplete={() => {
                        markEntered(shot.id);
                      }}
                      transition={
                        reducedMotion
                          ? WALL_REDUCED_MOTION_FADE
                          : { ...WALL_ENTRANCE_SPRING, delay }
                      }
                    >
                      <ShotCard
                        favoritePendingShotId={favoritePendingShotId}
                        isCurator={isCurator}
                        onAuthorToggle={onAuthorToggle}
                        onFocusChange={onFocusChange}
                        onToggleFavorite={onToggleFavorite}
                        selectedAuthor={selectedAuthor}
                        shot={shot}
                      />
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
          {hasNextPage ? (
            <div className="mt-8 flex justify-center">
              <Button
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage?.()}
                variant="outline"
              >
                {isFetchingNextPage ? 'Loading more…' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function GallerySkeleton({
  columnCount,
  gridRef,
}: {
  columnCount: number;
  gridRef: (node: HTMLElement | null) => void;
}) {
  /** Portrait / landscape mix — roughly matches real shot aspect spread. */
  const aspectRatios = ['4 / 5', '3 / 4', '5 / 4', '16 / 10'] as const;
  const rowsPerColumn = [3, 2, 3, 2, 2, 3];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3" ref={gridRef}>
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div className="flex min-w-0 flex-1 flex-col gap-3" key={columnIndex}>
            {Array.from({
              length: rowsPerColumn[columnIndex % rowsPerColumn.length],
            }).map((_, rowIndex) => (
              <div
                className="animate-pulse rounded-lg bg-muted/40"
                key={rowIndex}
                style={{
                  aspectRatio:
                    aspectRatios[
                      (columnIndex + rowIndex) % aspectRatios.length
                    ],
                  width: '100%',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <Text tone="muted" variant="small">
        Loading library…
      </Text>
    </div>
  );
}
