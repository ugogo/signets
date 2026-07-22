import type { Shot } from '@signets/shared';

import { Film, Play } from 'lucide-react';

import {
  shotFocusSource,
  shotIsMotion,
} from '@/features/library/lib/shot-media';
import { cn } from '@/lib/utils';

export function ShotDetailMedia({ shot }: { shot: Shot }) {
  const playbackSource = shotFocusSource(shot);
  const label =
    shot.kind === 'animated_gif'
      ? 'Animated GIF design reference'
      : 'Video design reference';

  return (
    <video
      aria-label={label}
      autoPlay
      className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain"
      loop
      muted
      onLoadedData={(event) => {
        void event.currentTarget.play().catch(() => {
          // Browser autoplay policy — poster remains visible as fallback.
        });
      }}
      playsInline
      poster={shot.mediaPosterUrl ?? undefined}
      src={playbackSource}
    />
  );
}

export function ShotKindBadge({ shot }: { shot: Shot }) {
  if (!shotIsMotion(shot)) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
      <Film className="size-3" />
      {shot.kind === 'animated_gif' ? 'GIF' : 'Video'}
    </span>
  );
}

export function ShotTileOverlay({ shot }: { shot: Shot }) {
  if (!shotIsMotion(shot)) {
    return null;
  }

  if (shot.kind === 'animated_gif') {
    return (
      <span
        aria-hidden
        className="absolute left-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-foreground backdrop-blur-sm"
      >
        GIF
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        'bg-background/10 transition-colors duration-200 group-hover:bg-background/20',
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm">
        <Play className="ml-0.5 size-4 fill-current" />
      </span>
    </span>
  );
}
