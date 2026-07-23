import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  filterShotsNewerThanLastSync,
  isAtOrBeforeLastSync,
  normalizeBookmarksResponse,
  sortIndexToBookmarkedAt,
} from '../src/bookmarks-parser.js';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const photoFixture = JSON.parse(
  readFileSync(join(fixtureDir, 'bookmarks-photo.json'), 'utf8'),
);
const searchTimelineFixture = JSON.parse(
  readFileSync(join(fixtureDir, 'bookmarks-search-timeline.json'), 'utf8'),
);

describe('sortIndexToBookmarkedAt', () => {
  it('derives an ISO timestamp from a Twitter snowflake sort index', () => {
    const bookmarkedAt = sortIndexToBookmarkedAt('1999999999999999999');
    expect(bookmarkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('normalizeBookmarksResponse', () => {
  it('extracts photo shots from a bookmark timeline response', () => {
    const shots = normalizeBookmarksResponse(photoFixture);

    expect(shots).toHaveLength(1);
    expect(shots[0]).toMatchObject({
      authorHandle: 'designer',
      authorName: 'Designer',
      kind: 'photo',
      mediaId: '9876543210',
      mediaUrl: 'https://pbs.twimg.com/media/sample.jpg?name=large',
      postId: '1234567890',
    });
  });

  it('extracts photo shots from BookmarkSearchTimeline responses', () => {
    const shots = normalizeBookmarksResponse(searchTimelineFixture);

    expect(shots).toHaveLength(1);
    expect(shots[0]?.postId).toBe('1234567890');
  });
});

describe('filterShotsNewerThanLastSync', () => {
  it('returns all shots when no watermark is set', () => {
    const shots = normalizeBookmarksResponse(photoFixture);
    expect(filterShotsNewerThanLastSync(shots, null)).toEqual(shots);
  });

  it('filters out shots at or before the watermark', () => {
    const shots = normalizeBookmarksResponse(photoFixture);
    const filtered = filterShotsNewerThanLastSync(
      shots,
      '2099-01-01T00:00:00.000Z',
    );
    expect(filtered).toHaveLength(0);
  });
});

describe('isAtOrBeforeLastSync', () => {
  it('detects when every shot is older than the watermark', () => {
    const shots = normalizeBookmarksResponse(photoFixture);
    expect(isAtOrBeforeLastSync(shots, '2099-01-01T00:00:00.000Z')).toBe(true);
  });
});
