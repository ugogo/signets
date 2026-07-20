import type { Shot } from '@signets/shared';

import { Maximize2, Minus, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { shotPosterSource } from '../lib/shot-media';
import { computeMasonryLayout, FALLBACK_ASPECT } from '../lib/canvas-grid';
import { useElementSize } from '../lib/use-element-size';
import { useCanvasViewport } from '../lib/use-pan-zoom';
import { tileInRect, useVisibleRect } from '../lib/use-visible-rect';
import { MediaCard } from './media-card';
import { MotionShotOverlay } from './motion-shot-media';

const COLUMN_WIDTH = 260;
const GAP = 16;
/** Breathing room around the content plane inside the viewport (pan bounds). */
const PADDING = 192;
const ZOOM_STEP = 1.6;
const KEYBOARD_PAN_STEP = 120;
// < 1 trims columns so the plane grows taller (more vertical) than the viewport.
const COLUMN_BIAS = 0.42;
// > 1 opens tighter than a plain width-fit.
const INITIAL_ZOOM = 1.75;
// Scale past which small thumbnails look soft, so we request a larger tier.
const MEDIUM_THUMBNAIL_SCALE = 1.75;

const EMPTY_LAYOUT = {
  columns: 0,
  content: { height: 0, width: 0 },
  tiles: [],
};

const DRAG_TRANSITION = {
  bounceDamping: 40,
  bounceStiffness: 320,
  power: 0.25,
  timeConstant: 320,
};

interface ShotCanvasProps {
  emptyMessage?: string;
  error?: Error | null;
  fetchNextPage?: () => void;
  focusedShot: null | Shot;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onFocusChange: (shot: null | Shot) => void;
  /** Identity of the current filter set; changing it re-fits the canvas. */
  resetKey?: unknown;
  shots: Shot[];
  total: number;
}

export function ShotCanvas({
  emptyMessage = 'No shots yet. Sync bookmarks from the companion extension.',
  error = null,
  fetchNextPage,
  focusedShot,
  hasNextPage = false,
  isFetchingNextPage = false,
  isLoading = false,
  onFocusChange,
  resetKey,
  shots,
  total,
}: ShotCanvasProps) {
  const count = Math.max(total, shots.length);
  const reducedMotion = useReducedMotion() ?? false;

  // Canvas shows the whole filtered slice, so keep pulling pages until the
  // ghost grid is full — but stop if a resolved page adds nothing (guards
  // against an endless refetch when a non-null cursor returns no items).
  const lastFetchedCountRef = useRef(-1);
  useEffect(() => {
    lastFetchedCountRef.current = -1;
  }, [resetKey]);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    if (shots.length === lastFetchedCountRef.current) {
      return;
    }
    lastFetchedCountRef.current = shots.length;
    fetchNextPage?.();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, shots.length]);

  const [containerRef, viewport] = useElementSize();

  const aspects = useMemo(() => {
    const list: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const shot = shots[index];
      list.push(
        shot && shot.width && shot.height
          ? shot.width / shot.height
          : FALLBACK_ASPECT,
      );
    }
    return list;
  }, [count, shots]);

  // Defer layout off the fill path: rapid page appends coalesce into fewer
  // full masonry recomputes instead of one per page.
  const deferredAspects = useDeferredValue(aspects);

  const layout = useMemo(
    () =>
      viewport
        ? computeMasonryLayout(
            deferredAspects,
            viewport,
            COLUMN_WIDTH,
            GAP,
            COLUMN_BIAS,
          )
        : EMPTY_LAYOUT,
    [deferredAspects, viewport],
  );

  const {
    dragConstraints,
    fitToView,
    isReady,
    panBy,
    scale,
    wheelFactor,
    x,
    y,
    zoomBy,
  } = useCanvasViewport({
    content: layout.content,
    initialZoom: INITIAL_ZOOM,
    padding: PADDING,
    reducedMotion,
    resetKey,
    viewport,
  });

  const viewRect = useVisibleRect(x, y, scale, viewport);

  // Coarse thumbnail tier, flipped only when scale crosses the threshold.
  const [highRes, setHighRes] = useState(false);
  useEffect(() => {
    const update = (value: number) => setHighRes(value >= MEDIUM_THUMBNAIL_SCALE);
    update(scale.get());
    return scale.on('change', update);
  }, [scale]);

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [nodeReady, setNodeReady] = useState(false);
  const draggingRef = useRef(false);
  const focusedRef = useRef<boolean>(focusedShot !== null);
  focusedRef.current = focusedShot !== null;
  // Cached container rect so the wheel handler avoids a per-tick reflow.
  const rectRef = useRef<DOMRect | null>(null);

  const surfaceRef = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      containerRef(node);
      rectRef.current = node?.getBoundingClientRect() ?? null;
      setNodeReady(node !== null);
    },
    [containerRef],
  );

  // React registers `wheel` as passive, so bind natively to preventDefault and
  // zoom toward the cursor instead of letting the page scroll.
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    const refreshRect = () => {
      rectRef.current = node.getBoundingClientRect();
    };
    const onWheel = (event: WheelEvent) => {
      if (focusedRef.current) {
        return;
      }
      event.preventDefault();
      const rect = rectRef.current ?? node.getBoundingClientRect();
      zoomBy(wheelFactor(event.deltaY), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', refreshRect);
    window.addEventListener('scroll', refreshRect, true);
    return () => {
      node.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', refreshRect);
      window.removeEventListener('scroll', refreshRect, true);
    };
  }, [nodeReady, wheelFactor, zoomBy]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (focusedRef.current) {
        return;
      }
      switch (event.key) {
        case '-':
        case '_':
          event.preventDefault();
          zoomBy(1 / ZOOM_STEP);
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomBy(ZOOM_STEP);
          break;
        case '0':
          event.preventDefault();
          fitToView();
          break;
        case 'ArrowDown':
          event.preventDefault();
          panBy(0, -KEYBOARD_PAN_STEP);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          panBy(KEYBOARD_PAN_STEP, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          panBy(-KEYBOARD_PAN_STEP, 0);
          break;
        case 'ArrowUp':
          event.preventDefault();
          panBy(0, KEYBOARD_PAN_STEP);
          break;
        default:
          break;
      }
    },
    [fitToView, panBy, zoomBy],
  );

  if (error) {
    return (
      <Text className="text-destructive">
        Could not reach the API. Start the NestJS server on port 3001.
      </Text>
    );
  }

  if (isLoading && shots.length === 0 && total === 0) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/20">
        <Text className="font-mono text-xs" tone="muted">
          Loading library…
        </Text>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/20 px-6 text-center">
        <Text weight="bold">Nothing here yet</Text>
        <Text tone="muted">{emptyMessage}</Text>
      </div>
    );
  }

  const loaded = shots.length;
  const isFilling = loaded < count;
  const thumbnailSize = highRes ? 'medium' : 'small';

  return (
    <div
      aria-label="Shot canvas. Arrow keys pan, plus and minus zoom, 0 fits."
      className="relative h-full w-full overflow-hidden rounded-xl bg-muted/10 shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onKeyDown={onKeyDown}
      ref={surfaceRef}
      role="application"
      tabIndex={0}
    >
      <motion.div
        className="absolute left-0 top-0 touch-none select-none"
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.06}
        dragMomentum={!reducedMotion}
        dragTransition={DRAG_TRANSITION}
        // Hide the plane from AT/tab order while the focus overlay owns the view.
        inert={focusedShot !== null || undefined}
        // Clear on every fresh press; set true only once a drag actually starts,
        // so a post-drag click is suppressed without racing a timer.
        onDragStart={() => {
          draggingRef.current = true;
        }}
        onPointerDownCapture={() => {
          draggingRef.current = false;
        }}
        style={{
          cursor: 'grab',
          height: layout.content.height,
          scale,
          transformOrigin: '0 0',
          width: layout.content.width,
          x,
          y,
        }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {layout.tiles.map((tile, index) => {
          if (viewRect && !tileInRect(tile, viewRect)) {
            return null;
          }

          const shot = shots[index];

          if (!shot) {
            return (
              <div
                className="absolute rounded-md border border-dashed border-border/60 bg-muted/20"
                key={`ghost-${index}`}
                style={{
                  height: tile.height,
                  left: tile.left,
                  top: tile.top,
                  width: tile.width,
                }}
              />
            );
          }

          return (
            <MediaCard
              as="button"
              className="press-scale animate-in fade-in absolute rounded-md transition-[box-shadow,transform] hover:z-10 hover:shadow-(--shadow-border-hover) hover:ring-2 hover:ring-primary"
              key={shot.id}
              onClick={() => {
                if (!draggingRef.current) {
                  onFocusChange(shot);
                }
              }}
              style={{
                height: tile.height,
                left: tile.left,
                top: tile.top,
                width: tile.width,
              }}
              type="button"
            >
              <img
                alt={shot.caption ?? `@${shot.authorHandle} design shot`}
                className="h-full w-full object-cover"
                decoding="async"
                draggable={false}
                loading="lazy"
                src={shotPosterSource(shot, thumbnailSize)}
              />
              <MotionShotOverlay shot={shot} />
            </MediaCard>
          );
        })}
      </motion.div>

      <div className="floating-chrome absolute right-3 top-3 flex flex-col gap-1.5 rounded-lg p-1 shadow-[var(--shadow-border)]">
        <Button
          aria-label="Zoom in"
          disabled={!isReady}
          onClick={() => zoomBy(ZOOM_STEP)}
          size="sm"
          variant="outline"
        >
          <Plus className="size-4" />
        </Button>
        <Button
          aria-label="Zoom out"
          disabled={!isReady}
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          size="sm"
          variant="outline"
        >
          <Minus className="size-4" />
        </Button>
        <Button
          aria-label="Fit all"
          disabled={!isReady}
          onClick={fitToView}
          size="sm"
          variant="outline"
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>

      {isFilling ? (
        <div
          aria-live="polite"
          className="floating-chrome absolute bottom-3 left-3 rounded-full px-3 py-1 shadow-[var(--shadow-border)] tabular-nums"
          role="status"
        >
          <Text tone="muted" variant="small">
            Loading {loaded.toLocaleString()} of {count.toLocaleString()}…
          </Text>
        </div>
      ) : null}
    </div>
  );
}
