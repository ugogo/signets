import { z } from 'zod';

export const syncShotInputSchema = z.object({
  authorHandle: z.string().min(1),
  authorName: z.string().optional(),
  bookmarkedAt: z.string().datetime(),
  caption: z.string().optional(),
  imageIndex: z.number().int().min(0).max(3),
  imageUrl: z.string().url(),
  xPostId: z.string().min(1),
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
  id: z.string().uuid(),
  imageIndex: z.number().int(),
  imageUrl: z.string().url(),
  isFavorite: z.boolean(),
  updatedAt: z.string().datetime(),
  xPostId: z.string(),
});

export type Shot = z.infer<typeof shotSchema>;

export const listShotsQuerySchema = z.object({
  author: z.string().optional(),
  favorites: z.enum(['true']).optional(),
  search: z.string().optional(),
});

export type ListShotsQuery = {
  author?: string;
  favorites?: boolean;
  search?: string;
};

export function parseListShotsQuery(
  query: z.infer<typeof listShotsQuerySchema>,
): ListShotsQuery {
  return {
    author: query.author,
    favorites: query.favorites === 'true' ? true : undefined,
    search: query.search,
  };
}

export const syncResultSchema = z.object({
  upserted: z.number().int().nonnegative(),
});

export type SyncResult = z.infer<typeof syncResultSchema>;
