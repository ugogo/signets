import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  buildBookmarksRequestUrl,
  extractBottomCursor,
} from '../src/bookmarks-api.js';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const photoFixture = JSON.parse(
  readFileSync(join(fixtureDir, 'bookmarks-photo.json'), 'utf8'),
);
const searchTimelineFixture = JSON.parse(
  readFileSync(join(fixtureDir, 'bookmarks-search-timeline.json'), 'utf8'),
);

describe('extractBottomCursor', () => {
  it('returns undefined when no cursor entry exists', () => {
    expect(extractBottomCursor(photoFixture)).toBeUndefined();
  });

  it('extracts bottom cursors from TimelineAddEntries', () => {
    const body = {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                entries: [
                  {
                    content: {
                      cursorType: 'Bottom',
                      value: 'next-page-cursor',
                    },
                    entryId: 'cursor-bottom-abc',
                  },
                ],
              },
            ],
          },
        },
      },
    };

    expect(extractBottomCursor(body)).toBe('next-page-cursor');
  });

  it('extracts bottom cursors from TimelineReplaceEntry', () => {
    const body = {
      data: {
        search_by_raw_query: {
          bookmarks_search_timeline: {
            timeline: {
              instructions: [
                {
                  entry: {
                    content: {
                      cursorType: 'Bottom',
                      value: 'replace-entry-cursor',
                    },
                    entryId: 'cursor-bottom-0',
                  },
                  type: 'TimelineReplaceEntry',
                },
              ],
            },
          },
        },
      },
    };

    expect(extractBottomCursor(body)).toBe('replace-entry-cursor');
  });

  it('reads cursors from BookmarkSearchTimeline fixtures', () => {
    const body = {
      ...searchTimelineFixture,
      data: {
        ...searchTimelineFixture.data,
        search_by_raw_query: {
          bookmarks_search_timeline: {
            timeline: {
              instructions: [
                {
                  entries: [
                    ...(searchTimelineFixture.data.search_by_raw_query
                      .bookmarks_search_timeline.timeline.instructions[0]
                      .entries ?? []),
                    {
                      content: {
                        cursorType: 'Bottom',
                        value: 'search-cursor',
                      },
                      entryId: 'cursor-bottom-search',
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    };

    expect(extractBottomCursor(body)).toBe('search-cursor');
  });
});

describe('buildBookmarksRequestUrl', () => {
  it('preserves captured variables and adds the pagination cursor', () => {
    const url = new URL(
      buildBookmarksRequestUrl(
        {
          features: { responsive_web_graphql_enabled: true },
          operation: 'BookmarkSearchTimeline',
          queryId: 'abc123',
          variables: {
            count: 20,
            querySource: 'typed_query',
            rawQuery: '',
          },
        },
        'page-2-cursor',
      ),
    );

    const variables = JSON.parse(url.searchParams.get('variables') ?? '{}') as {
      count: number;
      cursor: string;
      querySource: string;
    };

    expect(variables.count).toBe(20);
    expect(variables.cursor).toBe('page-2-cursor');
    expect(variables.querySource).toBe('typed_query');
    expect(url.pathname).toContain('/abc123/BookmarkSearchTimeline');
  });
});
