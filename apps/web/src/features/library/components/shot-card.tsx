import type { Shot } from '@signets/shared';

import { Star } from 'lucide-react';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';

import { shotPosterSource } from '@/features/library/lib/shot-media';
import { cn } from '@/lib/utils';

import { MediaCard } from './media-card';
import { ShotTileOverlay } from './shot-media-ui';

const FALLBACK_ASPECT_RATIO = '4 / 5';

export interface ShotCardProps {
  favoritePendingShotId?: null | string;
  isCurator?: boolean;
  onAuthorToggle?: (authorHandle: string) => void;
  onFocusChange?: (shot: Shot) => void;
  onToggleFavorite?: (shot: Shot) => void;
  selectedAuthor?: null | string;
  shot: Shot;
}

export function ShotCard({
  favoritePendingShotId = null,
  isCurator = false,
  onAuthorToggle,
  onFocusChange,
  onToggleFavorite,
  selectedAuthor,
  shot,
}: ShotCardProps) {
  const authorActive = selectedAuthor === shot.authorHandle;
  const isFavoritePending = favoritePendingShotId === shot.id;
  const mediaLabel = shot.caption ?? `@${shot.authorHandle} design shot`;

  return (
    <article className="group relative w-full">
      <MediaCard className="press-scale block transition-[box-shadow,transform] duration-200 ease-out hover:shadow-(--shadow-border-hover) hover-fine:-translate-y-0.5">
        <button
          aria-label={`Open ${mediaLabel}`}
          className="block w-full text-left"
          onClick={() => onFocusChange?.(shot)}
          type="button"
        >
          <div
            className="relative w-full bg-muted/20"
            style={{
              aspectRatio:
                shot.width && shot.height
                  ? `${shot.width} / ${shot.height}`
                  : FALLBACK_ASPECT_RATIO,
            }}
          >
            <img
              alt={mediaLabel}
              className="block h-full w-full object-cover transition-transform duration-200 ease-out hover-fine:group-hover:scale-[1.02]"
              decoding="async"
              height={shot.height ?? undefined}
              loading="lazy"
              src={shotPosterSource(shot, 'medium')}
              width={shot.width ?? undefined}
            />
            <ShotTileOverlay shot={shot} />
          </div>
        </button>

        {shot.isFavorite || isCurator ? (
          <span className="absolute right-2 top-2 flex items-center gap-1">
            {isCurator ? (
              <Button
                aria-label={
                  shot.isFavorite ? 'Remove favorite' : 'Mark as favorite'
                }
                aria-pressed={shot.isFavorite}
                disabled={isFavoritePending}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite?.(shot);
                }}
                size="icon-xs"
                variant="ghost"
              >
                <Star
                  className={cn(
                    'size-3.5',
                    shot.isFavorite && 'fill-primary text-primary',
                  )}
                />
              </Button>
            ) : shot.isFavorite ? (
              <span className="flex size-7 items-center justify-center">
                <Star className="size-3.5 fill-primary text-primary" />
              </span>
            ) : null}
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
            onClick={() => onAuthorToggle?.(shot.authorHandle)}
            size="sm"
            variant={authorActive ? 'secondary' : 'ghost'}
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
