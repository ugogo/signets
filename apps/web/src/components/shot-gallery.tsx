import type { Shot } from '@signets/shared';

import { useMemo } from 'react';

import { xThumbnailUrl } from '../lib/api';

interface GalleryProps {
  density: number;
  shots: Shot[];
}

export function ShotGallery({ density, shots }: GalleryProps) {
  const columnWidth = useMemo(() => {
    const min = 120;
    const max = 420;
    return Math.round(min + ((max - min) * density) / 100);
  }, [density]);

  if (shots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center text-zinc-400">
        No shots yet. Sync bookmarks from the companion extension.
      </div>
    );
  }

  return (
    <div
      className="gap-3"
      style={{
        columnCount: 'auto',
        columnWidth: `${columnWidth}px`,
      }}
    >
      {shots.map((shot) => (
        <article
          className="mb-3 break-inside-avoid overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm"
          key={shot.id}
        >
          <a
            className="block"
            href={`https://x.com/i/web/status/${shot.xPostId}`}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={shot.caption ?? `@${shot.authorHandle} design shot`}
              className="block w-full bg-zinc-950 object-cover"
              loading="lazy"
              src={xThumbnailUrl(
                shot.imageUrl,
                density < 35 ? 'small' : 'medium',
              )}
            />
          </a>
          <div className="space-y-1 px-3 py-2 text-sm">
            <p className="font-medium text-zinc-100">@{shot.authorHandle}</p>
            {shot.caption ? (
              <p className="line-clamp-2 text-zinc-400">{shot.caption}</p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
