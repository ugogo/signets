export type BookmarksRequestParams = {
  features: Record<string, unknown>;
  fieldToggles?: Record<string, unknown>;
  headers: Record<string, string>;
  operation: string;
  queryId: string;
  variables: Record<string, unknown>;
};

type CursorTimelineBody = {
  data?: {
    bookmark_timeline_v2?: {
      timeline?: {
        instructions?: CursorTimelineInstruction[];
      };
    };
    search_by_raw_query?: {
      bookmarks_search_timeline?: {
        timeline?: {
          instructions?: CursorTimelineInstruction[];
        };
      };
    };
  };
};

type CursorTimelineInstruction = {
  entries?: TimelineCursorEntry[];
  entry?: TimelineCursorEntry;
  type?: string;
};

type TimelineCursorEntry = {
  content?: {
    cursorType?: string;
    value?: string;
  };
  entryId?: string;
};

const DEFAULT_BOOKMARKS_PAGE_SIZE = 100;

export function buildBookmarksRequestUrl(
  params: Omit<BookmarksRequestParams, 'headers'>,
  cursor?: string,
): string {
  const variables: Record<string, unknown> = {
    ...params.variables,
  };

  if (cursor) {
    variables.cursor = cursor;
  } else {
    delete variables.cursor;
  }

  if (variables.count === undefined) {
    variables.count = DEFAULT_BOOKMARKS_PAGE_SIZE;
  }

  const url = new URL(
    `https://x.com/i/api/graphql/${params.queryId}/${params.operation}`,
  );
  url.searchParams.set('variables', JSON.stringify(variables));
  url.searchParams.set('features', JSON.stringify(params.features));
  if (params.fieldToggles) {
    url.searchParams.set('fieldToggles', JSON.stringify(params.fieldToggles));
  }
  return url.toString();
}

export function extractBottomCursor(body: unknown): string | undefined {
  const entries = collectTimelineEntries(body as CursorTimelineBody);
  let bottomCursor: string | undefined;

  for (const entry of entries) {
    const value = entry.content?.value;
    if (typeof value !== 'string' || value.length === 0) {
      continue;
    }

    if (isBottomCursorEntry(entry)) {
      bottomCursor = value;
    }
  }

  return bottomCursor;
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
  if (!variablesRaw) {
    return null;
  }

  const featuresRaw = parsed.searchParams.get('features');
  const fieldTogglesRaw = parsed.searchParams.get('fieldToggles');

  try {
    return {
      features: featuresRaw
        ? (JSON.parse(featuresRaw) as Record<string, unknown>)
        : {},
      ...(fieldTogglesRaw
        ? {
            fieldToggles: JSON.parse(fieldTogglesRaw) as Record<
              string,
              unknown
            >,
          }
        : {}),
      operation: match[2]!,
      queryId: match[1]!,
      variables: JSON.parse(variablesRaw) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

function collectTimelineEntries(
  body: CursorTimelineBody,
): TimelineCursorEntry[] {
  const instructions =
    body.data?.bookmark_timeline_v2?.timeline?.instructions ??
    body.data?.search_by_raw_query?.bookmarks_search_timeline?.timeline
      ?.instructions ??
    [];

  const entries: TimelineCursorEntry[] = [];

  for (const instruction of instructions) {
    if (instruction.entries?.length) {
      entries.push(...instruction.entries);
    }

    if (instruction.entry) {
      entries.push(instruction.entry);
    }
  }

  return entries;
}

function isBottomCursorEntry(entry: TimelineCursorEntry): boolean {
  return (
    entry.entryId?.startsWith('cursor-bottom') === true ||
    entry.content?.cursorType === 'Bottom'
  );
}
