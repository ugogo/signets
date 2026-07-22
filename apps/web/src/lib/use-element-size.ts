import { useCallback, useEffect, useRef, useState } from 'react';

import type { Size } from './use-pan-zoom';

/**
 * Measure an element via ResizeObserver. Returns a callback ref to attach and
 * the latest size (null until first measured). Resize callbacks are coalesced
 * onto a single rAF so dragging a window edge does not fire a render per frame.
 */
export function useElementSize(): [
  (node: HTMLElement | null) => void,
  null | Size,
] {
  const [size, setSize] = useState<null | Size>(null);
  const observerRef = useRef<null | ResizeObserver>(null);
  const frameRef = useRef(0);
  const pendingRef = useRef<null | Size>(null);

  const flush = useCallback(() => {
    frameRef.current = 0;
    if (pendingRef.current) {
      setSize(pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (next: Size) => {
      pendingRef.current = next;
      if (frameRef.current === 0) {
        frameRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const ref = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      setSize({ height: rect.height, width: rect.width });

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            const { height, width } = entry.contentRect;
            schedule({ height, width });
          }
        });
        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [schedule],
  );

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      if (frameRef.current !== 0) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  return [ref, size];
}
