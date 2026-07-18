import type { Shot } from '@signets/shared';

import { ExternalLink, X } from 'lucide-react';
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

interface ShotFocusProps {
  onDismiss: () => void;
  shot: Shot;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * In-place focus for a single canvas shot: enlarged image, metadata strip and a
 * link back to X. A modal dialog — Escape or backdrop click dismisses, focus is
 * trapped inside and restored to the triggering element on close.
 */
export function ShotFocus({ onDismiss, shot }: ShotFocusProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();

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

  return (
    <div
      className="animate-in fade-in absolute inset-0 z-20 flex items-center justify-center bg-background/80 p-6 backdrop-blur"
      onClick={onDismiss}
      role="presentation"
    >
      <div
        aria-labelledby={labelId}
        aria-modal="true"
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-2">
          <img
            alt={shot.caption ?? `@${shot.authorHandle} design shot`}
            className="max-h-[60vh] w-auto max-w-full object-contain"
            src={xThumbnailUrl(shot.imageUrl, 'large')}
          />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
          <div className="min-w-0 space-y-1">
            <Text id={labelId} weight="bold">
              @{shot.authorHandle}
            </Text>
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
      </div>
    </div>
  );
}
