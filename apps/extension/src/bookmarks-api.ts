export type BookmarksRequestParams = {
  features: Record<string, unknown>;
  headers: Record<string, string>;
  operation: string;
  queryId: string;
  variables: Record<string, unknown>;
};

type CursorTimelineBody = {
  data?: {
    bookmark_timeline_v2?: {
      timeline?: {
        instructions?: Array<{
          entries?: TimelineCursorEntry[];
          type?: string;
        }>;
      };
    };
    search_by_raw_query?: {
      bookmarks_search_timeline?: {
        timeline?: {
          instructions?: Array<{
            entries?: TimelineCursorEntry[];
            type?: string;
          }>;
        };
      };
    };
  };
};

type TimelineCursorEntry = {
  content?: {
    cursorType?: string;
    value?: string;
  };
  entryId?: string;
};

const BOOKMARKS_PAGE_SIZE = 100;

export function buildBookmarksRequestUrl(
  params: Omit<BookmarksRequestParams, 'headers'>,
  cursor?: string,
): string {
  const variables: Record<string, unknown> = {
    ...params.variables,
    count: BOOKMARKS_PAGE_SIZE,
  };

  if (cursor) {
    variables.cursor = cursor;
  } else {
    delete variables.cursor;
  }

  const url = new URL(
    `https://x.com/i/api/graphql/${params.queryId}/${params.operation}`,
  );
  url.searchParams.set('variables', JSON.stringify(variables));
  url.searchParams.set('features', JSON.stringify(params.features));
  return url.toString();
}

export function extractBottomCursor(body: unknown): string | undefined {
  const timelineBody = body as CursorTimelineBody;
  const instructions =
    timelineBody.data?.bookmark_timeline_v2?.timeline?.instructions ??
    timelineBody.data?.search_by_raw_query?.bookmarks_search_timeline?.timeline
      ?.instructions ??
    [];

  for (const instruction of instructions) {
    if (instruction.type !== 'TimelineAddEntries') {
      continue;
    }

    for (const entry of instruction.entries ?? []) {
      if (
        entry.entryId?.startsWith('cursor-bottom') &&
        typeof entry.content?.value === 'string' &&
        entry.content.value.length > 0
      ) {
        return entry.content.value;
      }
    }
  }

  return undefined;
}

export function parseBookmarksRequestUrl(
  requestUrl: string,
): null | Omit<BookmarksRequestParams, 'headers'> {
  let parsed: URL;
  try {
    parsed = new URL(requestUrl, 'https://x.com');
  } catch {
    return null;
  }

  const match = parsed.pathname.match(/\/i\/api\/graphql\/([^/]+)\/([^/]+)/i);
  if (!match) {
    return null;
  }

  const variablesRaw = parsed.searchParams.get('variables');
  const featuresRaw = parsed.searchParams.get('features');
  if (!variablesRaw || !featuresRaw) {
    return null;
  }

  try {
    return {
      features: JSON.parse(featuresRaw) as Record<string, unknown>,
      operation: match[2]!,
      queryId: match[1]!,
      variables: JSON.parse(variablesRaw) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}
