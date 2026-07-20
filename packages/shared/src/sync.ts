import { z } from 'zod';

import { shotKindSchema } from './shot-kind.js';

export const syncShotInputSchema = z
  .object({
    authorHandle: z.string().min(1),
    authorName: z.string().optional(),
    bookmarkedAt: z.iso.datetime(),
    caption: z.string().optional(),
    height: z.number().int().positive().optional(),
    kind: shotKindSchema,
    mediaId: z.string().min(1),
    mediaPosterUrl: z.url().optional(),
    mediaUrl: z.url(),
    postId: z.string().min(1),
    width: z.number().int().positive().optional(),
  })
  .superRefine((shot, ctx) => {
    if (shot.kind !== 'photo' && !shot.mediaPosterUrl) {
      ctx.addIssue({
        code: 'custom',
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

export const syncStateSchema = z.object({
  lastBookmarkSyncAt: z.iso.datetime().nullable(),
});

export type SyncState = z.infer<typeof syncStateSchema>;

export const syncResultSchema = z.object({
  lastBookmarkSyncAt: z.iso.datetime(),
  upserted: z.number().int().nonnegative(),
});

export type SyncResult = z.infer<typeof syncResultSchema>;

export function validateSyncShotInput(
  shot: SyncShotInput,
): SyncShotInput | undefined {
  const result = syncShotInputSchema.safeParse(shot);
  return result.success ? result.data : undefined;
}
