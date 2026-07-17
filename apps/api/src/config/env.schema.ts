import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  USER_SLUG: z.string().min(1).default('default'),
  PORT: z.coerce.number().int().positive().default(3001),
  SYNC_TOKEN: z.string().min(16),
  WEB_ORIGIN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function parseWebOrigins(webOrigin: string): string[] {
  return webOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
