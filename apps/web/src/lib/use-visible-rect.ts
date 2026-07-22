import { type MotionValue, useMotionValueEvent } from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { Size } from './use-pan-zoom';

export interface ContentRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface Tile {
  height: number;
  left: number;
  top: number;
  width: number;
}

/** Whether a laid-out tile overlaps the (already margin-expanded) view rect. */
export function tileInRect(tile: Tile, rect: ContentRect): boolean {
  return (
    tile.left < rect.right &&
    tile.left + tile.width > rect.left &&
    tile.top < rect.bottom &&
    tile.top + tile.height > rect.top
  );
}

/** Content-space rect currently visible for a given screen transform. */
export function visibleContentRect(
  x: number,
  y: number,
  scale: number,
  viewport: Size,
  margin: number,
): ContentRect {
  return {
    bottom: (viewport.height - y) / scale + margin,
    left: -x / scale - margin,
    right: (viewport.width - x) / scale + margin,
    top: -y / scale - margin,
  };
}

const DEFAULT_MARGIN = 512;
const UPDATE_THRESHOLD = 128;

/**
 * Track the visible content rect for pan/zoom virtualization. Subscribes to the
 * `x`/`y`/`scale` motion values and updates a state rect on a coalesced rAF,
 * only re-rendering when the rect shifts past a threshold (so sub-tile jitter
 * during momentum does not thrash React).
 */
export function useVisibleRect(
  x: MotionValue<number>,
  y: MotionValue<number>,
  scale: MotionValue<number>,
  viewport: null | Size,
  margin: number = DEFAULT_MARGIN,
): ContentRect | null {
  const [rect, setRect] = useState<ContentRect | null>(null);
  const frameRef = useRef(0);

  const compute = useCallback(() => {
    frameRef.current = 0;
    if (!viewport) {
      return;
    }
    const next = visibleContentRect(
      x.get(),
      y.get(),
      scale.get(),
      viewport,
      margin,
    );
    setRect((prev) => (prev && !movedEnough(prev, next) ? prev : next));
  }, [margin, scale, viewport, x, y]);

  const schedule = useCallback(() => {
    if (frameRef.current === 0) {
      frameRef.current = requestAnimationFrame(compute);
    }
  }, [compute]);

  useMotionValueEvent(x, 'change', schedule);
  useMotionValueEvent(y, 'change', schedule);
  useMotionValueEvent(scale, 'change', schedule);

  // Recompute immediately on mount and whenever the viewport size changes.
  useLayoutEffect(() => {
    compute();
  }, [compute]);

  useEffect(
    () => () => {
      if (frameRef.current !== 0) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  return rect;
}

function movedEnough(a: ContentRect, b: ContentRect): boolean {
  return (
    Math.abs(a.left - b.left) > UPDATE_THRESHOLD ||
    Math.abs(a.right - b.right) > UPDATE_THRESHOLD ||
    Math.abs(a.top - b.top) > UPDATE_THRESHOLD ||
    Math.abs(a.bottom - b.bottom) > UPDATE_THRESHOLD
  );
}
