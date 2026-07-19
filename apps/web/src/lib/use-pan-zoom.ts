import {
  animate,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { UI_SPRING } from './motion';

export interface Size {
  height: number;
  width: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export interface PanConstraints {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/** Scale at which content fills the padded viewport, never upscaling past 1:1. */
export function computeFitScale(
  content: Size,
  viewport: Size,
  padding: number,
): number {
  if (content.width <= 0 || content.height <= 0) {
    return 1;
  }
  const availableWidth = Math.max(viewport.width - padding * 2, 1);
  const availableHeight = Math.max(viewport.height - padding * 2, 1);
  const scale = Math.min(
    availableWidth / content.width,
    availableHeight / content.height,
  );
  return Math.min(scale > 0 ? scale : 1, 1);
}

export function clampScale(scale: number, min: number, max: number): number {
  return Math.min(Math.max(scale, min), max);
}

/**
 * Opening zoom: scale so the (narrow, vertical) content fills the viewport width
 * rather than shrinking to fit its full height. Always at least the contain-fit
 * `min`, never above `max`.
 */
export function computeInitialScale(
  content: Size,
  viewport: Size,
  padding: number,
  min: number,
  max: number,
  boost = 1,
): number {
  if (content.width <= 0) {
    return min;
  }
  const fillWidth = Math.max(viewport.width - padding * 2, 1) / content.width;
  return clampScale(fillWidth * boost, min, max);
}

/**
 * Bounds for one axis within a padded viewport: centre the content when it is
 * smaller than the viewport, otherwise let it travel until its edges reach the
 * padding. Returns the inclusive `[min, max]` offset range.
 */
function axisBounds(
  scaledContent: number,
  viewport: number,
  padding: number,
): { max: number; min: number } {
  if (scaledContent + padding * 2 <= viewport) {
    const centre = (viewport - scaledContent) / 2;
    return { max: centre, min: centre };
  }
  return { max: padding, min: viewport - padding - scaledContent };
}

export function clampTranslate(
  transform: Transform,
  content: Size,
  viewport: Size,
  padding: number,
): Transform {
  const x = axisBounds(content.width * transform.scale, viewport.width, padding);
  const y = axisBounds(
    content.height * transform.scale,
    viewport.height,
    padding,
  );
  return {
    scale: transform.scale,
    x: Math.min(Math.max(transform.x, x.min), x.max),
    y: Math.min(Math.max(transform.y, y.min), y.max),
  };
}

/** Framer-style drag constraints (`{ top, left, right, bottom }`) for a scale. */
export function computePanConstraints(
  content: Size,
  viewport: Size,
  scale: number,
  padding: number,
): PanConstraints {
  const x = axisBounds(content.width * scale, viewport.width, padding);
  const y = axisBounds(content.height * scale, viewport.height, padding);
  return { bottom: y.max, left: x.min, right: x.max, top: y.min };
}

/** Rescale while keeping the content point beneath `point` visually fixed. */
export function zoomAtPoint(
  transform: Transform,
  nextScale: number,
  point: Point,
): Transform {
  const ratio = nextScale / transform.scale;
  return {
    scale: nextScale,
    x: point.x - (point.x - transform.x) * ratio,
    y: point.y - (point.y - transform.y) * ratio,
  };
}

const DEFAULT_PADDING = 96;
const DEFAULT_MAX_SCALE = 8;
const WHEEL_ZOOM_INTENSITY = 0.0032;
const ZOOM_SPRING = UI_SPRING;

export interface UseCanvasViewportOptions {
  content: Size;
  /** Multiplier on the width-fill opening zoom (> 1 opens tighter). */
  initialZoom?: number;
  maxScale?: number;
  padding?: number;
  /** When true, zoom snaps instantly (respects `prefers-reduced-motion`). */
  reducedMotion?: boolean;
  /** Changing this re-fits the view (e.g. when filters swap the content). */
  resetKey?: unknown;
  viewport: Size | null;
}

export interface UseCanvasViewport {
  /**
   * Stable object handed to `<motion.div dragConstraints>`. Its fields are
   * mutated in place as `scale` animates, so Motion (which reads the object at
   * drag start) always sees bounds matching what is on screen — without any
   * React re-render.
   */
  dragConstraints: PanConstraints;
  fitToView: () => void;
  isReady: boolean;
  panBy: (dx: number, dy: number) => void;
  scale: MotionValue<number>;
  wheelFactor: (deltaY: number) => number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  zoomBy: (factor: number, origin?: Point) => void;
}

interface ViewportParams {
  content: Size;
  maxScale: number;
  padding: number;
  viewport: null | Size;
}

/**
 * Bounded pan/zoom over a fixed-size content plane, built on Motion so drag
 * inertia and spring-animated zoom come from the library rather than hand-rolled
 * rAF. Pan is driven by `<motion.div drag>` reading the returned `x`/`y` motion
 * values within `dragConstraints`; zoom animates `scale`/`x`/`y` toward
 * cursor-anchored, clamped targets. Geometry lives in the pure helpers above.
 *
 * Zoom never routes through React state: constraints live in a mutated ref kept
 * fresh by a `scale` subscription, so a wheel gesture updates nothing in React.
 */
export function useCanvasViewport({
  content,
  initialZoom = 1,
  maxScale = DEFAULT_MAX_SCALE,
  padding = DEFAULT_PADDING,
  reducedMotion = false,
  resetKey,
  viewport,
}: UseCanvasViewportOptions): UseCanvasViewport {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const hasFitRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // Latest geometry, read by the stable callbacks below so their identities
  // never change (keeps the native wheel listener from re-binding mid-fill).
  const paramsRef = useRef<ViewportParams>({
    content,
    maxScale,
    padding,
    viewport,
  });
  paramsRef.current = { content, maxScale, padding, viewport };

  const isReady = viewport !== null && content.width > 0 && content.height > 0;

  // Stable object; fields are mutated, identity is not.
  const dragConstraints = useRef<PanConstraints>({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  }).current;

  const refreshConstraints = useCallback(() => {
    const { content: c, padding: p, viewport: v } = paramsRef.current;
    if (!v || c.width <= 0 || c.height <= 0) {
      return;
    }
    const next = computePanConstraints(c, v, scale.get(), p);
    dragConstraints.bottom = next.bottom;
    dragConstraints.left = next.left;
    dragConstraints.right = next.right;
    dragConstraints.top = next.top;
  }, [dragConstraints, scale]);

  // Bounds track the live (animating) scale, not a lagging snapshot.
  useMotionValueEvent(scale, 'change', refreshConstraints);

  const applyTransform = useCallback(
    (next: Transform, animated: boolean) => {
      if (animated && !reducedMotionRef.current) {
        isAnimatingRef.current = true;
        animate(scale, next.scale, ZOOM_SPRING);
        animate(x, next.x, ZOOM_SPRING);
        const settle = animate(y, next.y, ZOOM_SPRING);
        settle
          .then(() => {
            isAnimatingRef.current = false;
          })
          .catch(() => {
            isAnimatingRef.current = false;
          });
      } else {
        scale.set(next.scale);
        x.set(next.x);
        y.set(next.y);
      }
      refreshConstraints();
    },
    [refreshConstraints, scale, x, y],
  );

  const zoomBy = useCallback(
    (factor: number, origin?: Point) => {
      const { content: c, maxScale: max, padding: p, viewport: v } =
        paramsRef.current;
      if (!v || c.width <= 0 || c.height <= 0) {
        return;
      }
      const min = computeFitScale(c, v, p);
      const nextScale = clampScale(scale.get() * factor, min, max);
      const point = origin ?? { x: v.width / 2, y: v.height / 2 };
      const next = clampTranslate(
        zoomAtPoint({ scale: scale.get(), x: x.get(), y: y.get() }, nextScale, point),
        c,
        v,
        p,
      );
      applyTransform(next, true);
    },
    [applyTransform, scale, x, y],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const { content: c, padding: p, viewport: v } = paramsRef.current;
      if (!v || c.width <= 0 || c.height <= 0) {
        return;
      }
      const next = clampTranslate(
        { scale: scale.get(), x: x.get() + dx, y: y.get() + dy },
        c,
        v,
        p,
      );
      applyTransform(next, true);
    },
    [applyTransform, scale, x, y],
  );

  const wheelFactor = useCallback(
    (deltaY: number) => Math.exp(-deltaY * WHEEL_ZOOM_INTENSITY),
    [],
  );

  const fitToView = useCallback(() => {
    const { content: c, padding: p, viewport: v } = paramsRef.current;
    if (!v || c.width <= 0 || c.height <= 0) {
      return;
    }
    const fitScale = computeFitScale(c, v, p);
    applyTransform(
      clampTranslate({ scale: fitScale, x: 0, y: 0 }, c, v, p),
      true,
    );
  }, [applyTransform]);

  // Re-fit when the underlying content identity changes (filter/author swap).
  useEffect(() => {
    hasFitRef.current = false;
  }, [resetKey]);

  // First time the plane is measurable (or after a reset), open zoomed to width
  // and anchored near the top rather than fully zoomed out.
  useLayoutEffect(() => {
    if (isReady && viewport && !hasFitRef.current) {
      hasFitRef.current = true;
      const min = computeFitScale(content, viewport, padding);
      const initial = computeInitialScale(
        content,
        viewport,
        padding,
        min,
        maxScale,
        initialZoom,
      );
      applyTransform(
        clampTranslate(
          { scale: initial, x: 0, y: padding },
          content,
          viewport,
          padding,
        ),
        false,
      );
    }
  }, [applyTransform, content, initialZoom, isReady, maxScale, padding, viewport]);

  // Keep the transform valid as content grows (progressive fill) or the
  // viewport resizes — but never fight an in-flight zoom, and only write when a
  // value actually needs clamping (growth downward leaves the position valid).
  useLayoutEffect(() => {
    if (!viewport || content.width <= 0 || content.height <= 0) {
      return;
    }
    refreshConstraints();
    if (isAnimatingRef.current) {
      return;
    }
    const fitScale = computeFitScale(content, viewport, padding);
    const nextScale = clampScale(scale.get(), fitScale, maxScale);
    const clamped = clampTranslate(
      { scale: nextScale, x: x.get(), y: y.get() },
      content,
      viewport,
      padding,
    );
    if (nextScale !== scale.get()) {
      scale.set(nextScale);
    }
    if (clamped.x !== x.get()) {
      x.set(clamped.x);
    }
    if (clamped.y !== y.get()) {
      y.set(clamped.y);
    }
  }, [content, maxScale, padding, refreshConstraints, scale, viewport, x, y]);

  return {
    dragConstraints,
    fitToView,
    isReady,
    panBy,
    scale,
    wheelFactor,
    x,
    y,
    zoomBy,
  };
}
