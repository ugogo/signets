import { z } from 'zod';

export const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/** Matches any Chrome extension origin (unpacked IDs vary per install). */
export const CHROME_EXTENSION_ORIGIN_PATTERN = 'chrome-extension://*';

export function isAllowedCorsOrigin(
  origin: string | undefined,
  webOrigins: string[],
): boolean {
  if (!origin) {
    return true;
  }

  if (webOrigins.includes(origin)) {
    return true;
  }

  return origin.startsWith('chrome-extension://');
}

export function parseTrustedOrigins(webOrigin: string): string[] {
  return [...parseWebOrigins(webOrigin), CHROME_EXTENSION_ORIGIN_PATTERN];
}

export function parseWebOrigins(webOrigin: string): string[] {
  return webOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
