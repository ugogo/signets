import type { ShotKind, SyncShotInput } from '@signets/shared';

import { validateSyncShotInput } from '@signets/shared';

const TWITTER_EPOCH_MS = 1288834974657;

type BookmarkMedia = {
  id_str?: string;
  media_key?: string;
  media_url_https?: string;
  original_info?: {
    height?: number;
    width?: number;
  };
  sizes?: {
    large?: MediaSize;
  };
  type?: string;
  video_info?: {
    variants?: VideoVariant[];
  };
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

type BookmarkUserResult = {
  core?: {
    name?: string;
    screen_name?: string;
  };
  legacy?: null | {
    name?: string;
    screen_name?: string;
  };
};

type MediaSize = {
  h?: number;
  w?: number;
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
  sortIndex?: string;
};

type TimelineInstruction = {
  entries?: TimelineEntry[];
};

type TweetResultWrapper = BookmarkTweet & {
  __typename?: string;
  tweet?: BookmarkTweet;
};

type VideoVariant = {
  bitrate?: number;
  content_type?: string;
  url?: string;
};

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

export function filterShotsNewerThanLastSync(
  shots: SyncShotInput[],
  lastBookmarkSyncAt: null | string | undefined,
): SyncShotInput[] {
  if (!lastBookmarkSyncAt) {
    return shots;
  }

  const lastSyncMs = Date.parse(lastBookmarkSyncAt);
  if (Number.isNaN(lastSyncMs)) {
    return shots;
  }

  return shots.filter((shot) => Date.parse(shot.bookmarkedAt) > lastSyncMs);
}

export function isAtOrBeforeLastSync(
  shots: SyncShotInput[],
  lastBookmarkSyncAt: string,
): boolean {
  if (shots.length === 0) {
    return false;
  }

  return filterShotsNewerThanLastSync(shots, lastBookmarkSyncAt).length === 0;
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

export function sortIndexToBookmarkedAt(sortIndex: string): string {
  const id = BigInt(sortIndex);
  const timestampMs = Number(id >> 22n) + TWITTER_EPOCH_MS;
  return new Date(timestampMs).toISOString();
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

function extractMediaId(media: BookmarkMedia): string | undefined {
  if (media.id_str) {
    return media.id_str;
  }

  if (media.media_key) {
    const suffix = media.media_key.split('_').at(-1);
    if (suffix) {
      return suffix;
    }
  }

  const url = media.media_url_https;
  if (url) {
    const match = url.match(/\/media\/([^/?]+)/);
    if (match?.[1]) {
      return match[1];
    }
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

function mediaToShot(
  media: BookmarkMedia,
  tweet: BookmarkTweet,
  bookmarkedAt: string,
): SyncShotInput | undefined {
  const kind = normalizeMediaKind(media.type);
  const mediaId = extractMediaId(media);
  const postId = tweet.rest_id;

  if (!kind || !mediaId || !postId) {
    return undefined;
  }

  const legacy = tweet.legacy;
  const caption =
    tweet.note_tweet?.note_tweet_results?.result?.text ?? legacy?.full_text;
  const author = extractAuthor(tweet.core?.user_results?.result);
  const width = media.original_info?.width ?? media.sizes?.large?.w;
  const height = media.original_info?.height ?? media.sizes?.large?.h;

  if (kind === 'photo') {
    if (!media.media_url_https) {
      return undefined;
    }

    return validateSyncShotInput({
      authorHandle: author.handle,
      authorName: author.name,
      bookmarkedAt,
      caption,
      height: height && height > 0 ? height : undefined,
      kind,
      mediaId,
      mediaUrl: `${media.media_url_https}?name=large`,
      postId,
      width: width && width > 0 ? width : undefined,
    });
  }

  const mediaUrl = pickMp4Variant(media);
  if (!media.media_url_https || !mediaUrl) {
    return undefined;
  }

  return validateSyncShotInput({
    authorHandle: author.handle,
    authorName: author.name,
    bookmarkedAt,
    caption,
    height: height && height > 0 ? height : undefined,
    kind,
    mediaId,
    mediaPosterUrl: `${media.media_url_https}?name=small`,
    mediaUrl,
    postId,
    width: width && width > 0 ? width : undefined,
  });
}

function normalizeMediaKind(type: string | undefined): ShotKind | undefined {
  if (!type || type === 'photo') {
    return 'photo';
  }

  if (type === 'video') {
    return 'video';
  }

  if (type === 'animated_gif') {
    return 'animated_gif';
  }

  return undefined;
}

function pickMp4Variant(media: BookmarkMedia): string | undefined {
  const variants = media.video_info?.variants ?? [];
  const mp4Variants = variants.filter(
    (variant) => variant.content_type === 'video/mp4' && variant.url,
  );

  if (mp4Variants.length === 0) {
    return undefined;
  }

  mp4Variants.sort((left, right) => (left.bitrate ?? 0) - (right.bitrate ?? 0));
  const middleIndex = Math.floor((mp4Variants.length - 1) / 2);
  return mp4Variants[middleIndex]?.url;
}

function resolveBookmarkedAt(
  entry: TimelineEntry,
  tweet: BookmarkTweet,
): string {
  if (entry.sortIndex) {
    return sortIndexToBookmarkedAt(entry.sortIndex);
  }

  return new Date(tweet.legacy?.created_at ?? Date.now()).toISOString();
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

    shots.push(...tweetToShots(tweet, resolveBookmarkedAt(entry, tweet)));
  }

  return shots;
}

function tweetToShots(
  tweet: BookmarkTweet,
  bookmarkedAt: string,
): SyncShotInput[] {
  const legacy = tweet.legacy;
  if (!tweet.rest_id || !legacy) {
    return [];
  }

  const media = legacy.extended_entities?.media ?? legacy.entities?.media ?? [];

  return media.flatMap((item) => {
    const shot = mediaToShot(item, tweet, bookmarkedAt);
    return shot ? [shot] : [];
  });
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
