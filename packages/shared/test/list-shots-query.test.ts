import { describe, expect, it } from 'vitest';

import {
  decodeShotCursor,
  encodeShotCursor,
  parseListShotsQuery,
} from '../src/index.js';

describe('parseListShotsQuery', () => {
  it('parses pagination and filter params', () => {
    expect(
      parseListShotsQuery({
        author: 'stripe',
        cursor: 'abc',
        favorites: 'true',
        limit: 12,
        search: 'logo',
      }),
    ).toEqual({
      author: 'stripe',
      cursor: 'abc',
      favorites: true,
      limit: 12,
      search: 'logo',
    });
  });
});

describe('shot cursor helpers', () => {
  it('round-trips a cursor', () => {
    const cursor = {
      bookmarkedAt: '2026-01-15T12:00:00.000Z',
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    expect(decodeShotCursor(encodeShotCursor(cursor))).toEqual(cursor);
  });

  it('returns null for invalid cursor input', () => {
    expect(decodeShotCursor('not-a-cursor')).toBeNull();
    expect(
      decodeShotCursor(
        encodeShotCursor({
          bookmarkedAt: '2026-01-15T12:00:00.000Z',
          id: 'not-a-uuid',
        }),
      ),
    ).toBeNull();
  });
});
