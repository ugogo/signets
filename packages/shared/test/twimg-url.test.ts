import { describe, expect, it } from 'vitest';

import { isAllowedTwimgUrl } from '../src/twimg-url.js';

describe('isAllowedTwimgUrl', () => {
  it('accepts pbs.twimg.com URLs', () => {
    expect(
      isAllowedTwimgUrl('https://pbs.twimg.com/media/abc.jpg?name=large'),
    ).toBe(true);
  });

  it('accepts video.twimg.com URLs', () => {
    expect(
      isAllowedTwimgUrl('https://video.twimg.com/ext_tw_video/123.mp4'),
    ).toBe(true);
  });

  it('rejects arbitrary hosts', () => {
    expect(isAllowedTwimgUrl('https://example.com/image.jpg')).toBe(false);
  });

  it('rejects non-HTTPS URLs', () => {
    expect(isAllowedTwimgUrl('http://pbs.twimg.com/media/abc.jpg')).toBe(false);
  });
});
