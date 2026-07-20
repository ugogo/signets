import { z } from 'zod';

export const SHOTS_PAGE_SIZE = 24;
export const SHOTS_PAGE_SIZE_MAX = 100;

export const shotKindSchema = z.enum(['photo', 'video', 'animated_gif']);

export type ShotKind = z.infer<typeof shotKindSchema>;

export const syncShotInputSchema = z
  .object({
    authorHandle: z.string().min(1),
    authorName: z.string().optional(),
    bookmarkedAt: z.string().datetime(),
    caption: z.string().optional(),
    height: z.number().int().positive().optional(),
    kind: shotKindSchema,
    mediaId: z.string().min(1),
    mediaPosterUrl: z.string().url().optional(),
    mediaUrl: z.string().url(),
    postId: z.string().min(1),
    width: z.number().int().positive().optional(),
  })
  .superRefine((shot, ctx) => {
    if (shot.kind !== 'photo' && !shot.mediaPosterUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'mediaPosterUrl is required for video and animated GIF shots',
        path: ['mediaPosterUrl'],
      });
    }
  });

export const syncPayloadSchema = z.object({
  shots: z.array(syncShotInputSchema).min(1),
});

export type SyncPayload = z.infer<typeof syncPayloadSchema>;
export type SyncShotInput = z.infer<typeof syncShotInputSchema>;

export const shotSchema = z.object({
  authorHandle: z.string(),
  authorName: z.string().nullable(),
  bookmarkedAt: z.string().datetime(),
  caption: z.string().nullable(),
  createdAt: z.string().datetime(),
  height: z.number().int().positive().nullable(),
  id: z.string().uuid(),
  isFavorite: z.boolean(),
  kind: shotKindSchema,
  mediaId: z.string(),
  mediaPosterUrl: z.string().url().nullable(),
  mediaUrl: z.string().url(),
  postId: z.string(),
  updatedAt: z.string().datetime(),
  width: z.number().int().positive().nullable(),
});

export type Shot = z.infer<typeof shotSchema>;

export const shotCursorSchema = z.object({
  bookmarkedAt: z.string().datetime(),
  id: z.string().uuid(),
});

export type ShotCursor = z.infer<typeof shotCursorSchema>;

export const listShotsQuerySchema = z.object({
  author: z.string().optional(),
  cursor: z.string().optional(),
  favorites: z.enum(['true']).optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(SHOTS_PAGE_SIZE_MAX)
    .optional(),
  search: z.string().optional(),
});

export type ListShotsQuery = {
  author?: string;
  cursor?: string;
  favorites?: boolean;
  limit?: number;
  search?: string;
};

export const listShotsResponseSchema = z.object({
  items: z.array(shotSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nonnegative().optional(),
});

export type ListShotsResponse = z.infer<typeof listShotsResponseSchema>;

export const listShotAuthorsQuerySchema = z.object({
  favorites: z.enum(['true']).optional(),
  search: z.string().optional(),
});

export type ListShotAuthorsQuery = {
  favorites?: boolean;
  search?: string;
};

export function parseListShotsQuery(
  query: z.infer<typeof listShotsQuerySchema>,
): ListShotsQuery {
  return {
    author: query.author,
    cursor: query.cursor,
    favorites: query.favorites === 'true' ? true : undefined,
    limit: query.limit,
    search: query.search,
  };
}

export function parseListShotAuthorsQuery(
  query: z.infer<typeof listShotAuthorsQuerySchema>,
): ListShotAuthorsQuery {
  return {
    favorites: query.favorites === 'true' ? true : undefined,
    search: query.search,
  };
}

export function encodeShotCursor(cursor: ShotCursor): string {
  const json = JSON.stringify(cursor);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShotCursor(encoded: string): ShotCursor | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char: string) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = shotCursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const syncStateSchema = z.object({
  lastBookmarkSyncAt: z.string().datetime().nullable(),
});

export type SyncState = z.infer<typeof syncStateSchema>;

export const syncResultSchema = z.object({
  lastBookmarkSyncAt: z.string().datetime(),
  upserted: z.number().int().nonnegative(),
});

export type SyncResult = z.infer<typeof syncResultSchema>;
