import type { Shot } from '@signets/shared';

import { ExternalLink, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';

import { xThumbnailUrl } from '../lib/api';
import { REDUCED_MOTION_FADE, UI_SPRING } from '../lib/motion';
import { cn } from '../lib/utils';

interface ShotFocusProps {
  onAuthorToggle?: (authorHandle: string) => void;
  onDismiss: () => void;
  selectedAuthor?: string | null;
  shot: Shot;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * In-place focus for a single canvas shot: enlarged image, metadata strip and a
 * link back to X. A modal dialog — Escape or backdrop click dismisses, focus is
 * trapped inside and restored to the triggering element on close.
 */
export function ShotFocus({
  onAuthorToggle,
  onDismiss,
  selectedAuthor = null,
  shot,
}: ShotFocusProps) {
  const authorActive = selectedAuthor === shot.authorHandle;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();
  const reducedMotion = useReducedMotion() ?? false;

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onDismiss],
  );

  // Move focus into the dialog on open and restore it on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const scrimTransition = reducedMotion ? REDUCED_MOTION_FADE : UI_SPRING;
  const panelTransition = reducedMotion ? REDUCED_MOTION_FADE : UI_SPRING;
  const panelInitial = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96 };
  const panelAnimate = reducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1 };
  const panelExit = reducedMotion
    ? { opacity: 0 }
    : { filter: 'blur(4px)', opacity: 0, scale: 0.96, y: -12 };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 p-6 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60"
      exit={{ opacity: 0, y: -12 }}
      initial={{ opacity: 0 }}
      onClick={onDismiss}
      role="presentation"
      transition={scrimTransition}
    >
      <motion.div
        animate={panelAnimate}
        aria-labelledby={labelId}
        aria-modal="true"
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        exit={panelExit}
        initial={panelInitial}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
        transition={panelTransition}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-2">
          <img
            alt={shot.caption ?? `@${shot.authorHandle} design shot`}
            className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain"
            src={xThumbnailUrl(shot.imageUrl, 'large')}
          />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
          <div className="min-w-0 space-y-1">
            <Button
              aria-pressed={authorActive}
              className={cn(
                'h-auto rounded-md p-0 font-semibold',
                authorActive
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary',
              )}
              id={labelId}
              onClick={() => onAuthorToggle?.(shot.authorHandle)}
              size="sm"
              variant="ghost"
            >
              @{shot.authorHandle}
            </Button>
            {shot.caption ? (
              <Text className="line-clamp-2" tone="muted" variant="small">
                {shot.caption}
              </Text>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <a
                href={`https://x.com/i/web/status/${shot.xPostId}`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" />
                View on X
              </a>
            </Button>
            <Button
              aria-label="Close"
              onClick={onDismiss}
              size="sm"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
