import { describe, expect, it } from 'vitest';

import { syncPayloadSchema } from '../src/index.js';

describe('syncPayloadSchema', () => {
  it('accepts a valid photo sync payload', () => {
    const result = syncPayloadSchema.safeParse({
      shots: [
        {
          authorHandle: 'designer',
          bookmarkedAt: '2026-01-15T12:00:00.000Z',
          kind: 'photo',
          mediaId: '1234567890',
          mediaUrl: 'https://pbs.twimg.com/media/abc.jpg?name=small',
          postId: '123',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts video shots with a poster URL', () => {
    const result = syncPayloadSchema.safeParse({
      shots: [
        {
          authorHandle: 'designer',
          bookmarkedAt: '2026-01-15T12:00:00.000Z',
          kind: 'video',
          mediaId: '9876543210',
          mediaPosterUrl: 'https://pbs.twimg.com/media/poster.jpg',
          mediaUrl: 'https://video.twimg.com/ext_tw_video/123.mp4',
          postId: '456',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects motion shots without a poster URL', () => {
    const result = syncPayloadSchema.safeParse({
      shots: [
        {
          authorHandle: 'designer',
          bookmarkedAt: '2026-01-15T12:00:00.000Z',
          kind: 'animated_gif',
          mediaId: '9876543210',
          mediaUrl: 'https://video.twimg.com/tweet_video/123.mp4',
          postId: '456',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty shots array', () => {
    const result = syncPayloadSchema.safeParse({ shots: [] });
    expect(result.success).toBe(false);
  });
});
