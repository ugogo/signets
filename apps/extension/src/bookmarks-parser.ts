import type { SyncShotInput } from '@signets/shared';

type BookmarkMedia = {
  media_url_https?: string;
  type?: string;
};

type BookmarkUserResult = {
  core?: {
    name?: string;
    screen_name?: string;
  };
  legacy?: {
    name?: string;
    screen_name?: string;
  } | null;
};

type BookmarkTweet = {
  core?: {
    user_results?: {
      result?: BookmarkUserResult;
    };
  };
  legacy?: {
    created_at?: string;
    entities?: {
      media?: BookmarkMedia[];
    };
    extended_entities?: {
      media?: BookmarkMedia[];
    };
    full_text?: string;
  };
  note_tweet?: {
    note_tweet_results?: {
      result?: {
        text?: string;
      };
    };
  };
  rest_id?: string;
};

type TweetResultWrapper = BookmarkTweet & {
  __typename?: string;
  tweet?: BookmarkTweet;
};

type TimelineEntry = {
  content?: {
    entryType?: string;
    itemContent?: {
      tweet_results?: {
        result?: TweetResultWrapper;
      };
    };
  };
};

type TimelineInstruction = {
  entries?: TimelineEntry[];
};

type BookmarksResponse = {
  data?: {
    bookmark_timeline_v2?: {
      timeline?: {
        instructions?: TimelineInstruction[];
      };
    };
    search_by_raw_query?: {
      bookmarks_search_timeline?: {
        timeline?: {
          instructions?: TimelineInstruction[];
        };
      };
    };
  };
};

function isPhotoMedia(item: BookmarkMedia): boolean {
  if (!item.media_url_https) {
    return false;
  }

  if (!item.type || item.type === 'photo') {
    return true;
  }

  return item.type !== 'video' && item.type !== 'animated_gif';
}

function extractAuthor(user: BookmarkUserResult | undefined): {
  handle: string;
  name?: string;
} {
  const legacy = user?.legacy ?? undefined;
  const core = user?.core ?? undefined;
  const handle = core?.screen_name || legacy?.screen_name || 'unknown';
  const name = core?.name || legacy?.name;

  return { handle, name };
}

function unwrapTweet(
  result: TweetResultWrapper | undefined,
): BookmarkTweet | undefined {
  if (!result) {
    return undefined;
  }

  const candidate =
    result.__typename === 'TweetWithVisibilityResults' && result.tweet
      ? result.tweet
      : result.tweet?.rest_id
        ? result.tweet
        : result;

  if (candidate.rest_id && candidate.legacy) {
    return candidate;
  }

  return undefined;
}

function getTimelineInstructions(
  body: BookmarksResponse,
): TimelineInstruction[] {
  const bookmarkTimeline =
    body.data?.bookmark_timeline_v2?.timeline?.instructions;
  if (bookmarkTimeline?.length) {
    return bookmarkTimeline;
  }

  const searchTimeline =
    body.data?.search_by_raw_query?.bookmarks_search_timeline?.timeline
      ?.instructions;
  if (searchTimeline?.length) {
    return searchTimeline;
  }

  return [];
}

function collectTimelineEntries(body: BookmarksResponse): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const seen = new Set<TimelineEntry>();

  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    const record = node as Record<string, unknown>;
    const content = record.content;
    if (
      content &&
      typeof content === 'object' &&
      'itemContent' in content &&
      (content as TimelineEntry['content'])?.itemContent?.tweet_results
    ) {
      const entry = record as TimelineEntry;
      if (!seen.has(entry)) {
        seen.add(entry);
        entries.push(entry);
      }
    }

    for (const value of Object.values(record)) {
      visit(value);
    }
  };

  visit(body);
  return entries;
}

function tweetToShots(tweet: BookmarkTweet): SyncShotInput[] {
  const legacy = tweet.legacy;
  if (!tweet.rest_id || !legacy) {
    return [];
  }

  const media =
    legacy.extended_entities?.media ?? legacy.entities?.media ?? [];
  const photos = media.filter(isPhotoMedia);
  const caption =
    tweet.note_tweet?.note_tweet_results?.result?.text ?? legacy.full_text;
  const author = extractAuthor(tweet.core?.user_results?.result);

  return photos.flatMap((photo, index) => {
    if (!photo.media_url_https) {
      return [];
    }

    return [
      {
        authorHandle: author.handle,
        authorName: author.name,
        bookmarkedAt: new Date(legacy.created_at ?? Date.now()).toISOString(),
        caption,
        imageIndex: index,
        imageUrl: `${photo.media_url_https}?name=large`,
        xPostId: tweet.rest_id!,
      },
    ];
  });
}

function shotsFromEntries(entries: TimelineEntry[]): SyncShotInput[] {
  const shots: SyncShotInput[] = [];

  for (const entry of entries) {
    if (
      entry.content?.entryType &&
      entry.content.entryType !== 'TimelineTimelineItem'
    ) {
      continue;
    }

    const tweet = unwrapTweet(
      entry.content?.itemContent?.tweet_results?.result,
    );
    if (!tweet) {
      continue;
    }

    shots.push(...tweetToShots(tweet));
  }

  return shots;
}

export function normalizeBookmarksResponse(
  body: BookmarksResponse,
): SyncShotInput[] {
  const instructions = getTimelineInstructions(body);
  const instructionEntries = instructions.flatMap(
    (instruction) => instruction.entries ?? [],
  );
  const entries =
    instructionEntries.length > 0
      ? instructionEntries
      : collectTimelineEntries(body);

  return shotsFromEntries(entries);
}

export function countTimelineEntries(body: BookmarksResponse): number {
  const instructions = getTimelineInstructions(body);
  const instructionEntries = instructions.flatMap(
    (instruction) => instruction.entries ?? [],
  );

  if (instructionEntries.length > 0) {
    return instructionEntries.length;
  }

  return collectTimelineEntries(body).length;
}
