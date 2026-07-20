import { z } from 'zod';

export const xMediaQuerySchema = z.object({
  url: z.url(),
});

export type XMediaQuery = z.infer<typeof xMediaQuerySchema>;
