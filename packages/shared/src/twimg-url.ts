/** Host allowlist for X CDN media URLs (pbs.twimg.com, video.twimg.com). */
const ALLOWED_TWIMG_HOST = /^([a-z0-9-]+\.)?(video|pbs)\.twimg\.com$/;

export function isAllowedTwimgUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' && ALLOWED_TWIMG_HOST.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}
