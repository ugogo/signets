import type { Shot } from '@signets/shared';

import { xThumbnailUrl } from '@/lib/api';

import { xMediaPlaybackUrl } from './x-media';

export function shotFocusSource(shot: Shot): string {
  if (shot.kind === 'photo') {
    return xThumbnailUrl(shot.mediaUrl, 'large');
  }

  return xMediaPlaybackUrl(shot.mediaUrl);
}

export function shotIsMotion(shot: Shot): boolean {
  return shot.kind === 'video' || shot.kind === 'animated_gif';
}

export function shotPosterSource(
  shot: Shot,
  size: 'large' | 'medium' | 'small',
): string {
  if (shot.mediaPosterUrl) {
    return xThumbnailUrl(shot.mediaPosterUrl, size);
  }

  return xThumbnailUrl(shot.mediaUrl, size);
}

export function shotPostUrl(shot: Shot): string {
  return `https://x.com/i/web/status/${shot.postId}`;
}
