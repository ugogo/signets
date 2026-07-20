const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** Playback URL for X-hosted video/GIF bytes blocked by CDN Referer checks. */
export function xMediaPlaybackUrl(mediaUrl: string): string {
  const url = new URL('/x/media', apiBaseUrl);
  url.searchParams.set('url', mediaUrl);
  return url.toString();
}
