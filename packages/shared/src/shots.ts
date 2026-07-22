import { z } from 'zod';

import { SHOTS_PAGE_SIZE_MAX } from './constants.js';
import { shotKindSchema } from './shot-kind.js';

export const shotSchema = z.object({
  authorHandle: z.string(),
  authorName: z.string().nullable(),
  bookmarkedAt: z.iso.datetime(),
  caption: z.string().nullable(),
  createdAt: z.iso.datetime(),
  height: z.number().int().positive().nullable(),
  id: z.uuid(),
  isFavorite: z.boolean(),
  kind: shotKindSchema,
  mediaId: z.string(),
  mediaPosterUrl: z.url().nullable(),
  mediaUrl: z.url(),
  postId: z.string(),
  updatedAt: z.iso.datetime(),
  width: z.number().int().positive().nullable(),
});

export type Shot = z.infer<typeof shotSchema>;

export const shotCursorSchema = z.object({
  bookmarkedAt: z.iso.datetime(),
  id: z.uuid(),
});

export type ShotCursor = z.infer<typeof shotCursorSchema>;

export const shotIdParamSchema = z.object({
  id: z.uuid(),
});

export type ShotIdParam = z.infer<typeof shotIdParamSchema>;

export function decodeShotCursor(encoded: string): null | ShotCursor {
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

export function encodeShotCursor(cursor: ShotCursor): string {
  const json = JSON.stringify(cursor);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const listShotsQueryBaseSchema = z.object({
  author: z.string().optional(),
  cursor: z.string().optional(),
  favorites: z.enum(['true']).optional(),
  limit: z.coerce.number().int().positive().max(SHOTS_PAGE_SIZE_MAX).optional(),
  search: z.string().optional(),
});

export const listShotsQuerySchema = listShotsQueryBaseSchema.superRefine(
  (query, ctx) => {
    if (query.cursor && !decodeShotCursor(query.cursor)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid cursor',
        path: ['cursor'],
      });
    }
  },
);

export type ListShotsQuery = {
  author?: string;
  cursor?: string;
  favorites?: boolean;
  limit?: number;
  search?: string;
};

export const listShotsQueryParsedSchema = listShotsQuerySchema.transform(
  (query): ListShotsQuery => ({
    author: query.author,
    cursor: query.cursor,
    favorites: query.favorites === 'true' ? true : undefined,
    limit: query.limit,
    search: query.search,
  }),
);

export const listShotAuthorsQuerySchema = z.object({
  favorites: z.enum(['true']).optional(),
  search: z.string().optional(),
});

export type ListShotAuthorsQuery = {
  favorites?: boolean;
  search?: string;
};

export const listShotAuthorsQueryParsedSchema =
  listShotAuthorsQuerySchema.transform((query): ListShotAuthorsQuery => ({
    favorites: query.favorites === 'true' ? true : undefined,
    search: query.search,
  }));

export const listShotsResponseSchema = z.object({
  items: z.array(shotSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nonnegative().optional(),
});

export type ListShotsResponse = z.infer<typeof listShotsResponseSchema>;

export const listShotAuthorsResponseSchema = z.array(z.string());

export type ListShotAuthorsResponse = z.infer<
  typeof listShotAuthorsResponseSchema
>;

export function parseListShotAuthorsQuery(
  query: z.infer<typeof listShotAuthorsQuerySchema>,
): ListShotAuthorsQuery {
  return {
    favorites: query.favorites === 'true' ? true : undefined,
    search: query.search,
  };
}

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
