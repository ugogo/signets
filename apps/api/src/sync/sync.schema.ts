import { z } from 'zod';

export const syncVerifyResponseSchema = z.object({
  ok: z.literal(true),
});

export type SyncVerifyResponse = z.infer<typeof syncVerifyResponseSchema>;
