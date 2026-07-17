import { describe, expect, it } from 'vitest';

import { syncPayloadSchema } from '../src/index.js';

describe('syncPayloadSchema', () => {
  it('accepts a valid sync payload', () => {
    const result = syncPayloadSchema.safeParse({
      shots: [
        {
          authorHandle: 'designer',
          bookmarkedAt: '2026-01-15T12:00:00.000Z',
          imageIndex: 0,
          imageUrl: 'https://pbs.twimg.com/media/abc.jpg?name=small',
          xPostId: '123',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty shots array', () => {
    const result = syncPayloadSchema.safeParse({ shots: [] });
    expect(result.success).toBe(false);
  });
});
