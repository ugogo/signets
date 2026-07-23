import type { PrismaClient } from '@prisma/client';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';

import { type Env, parseTrustedOrigins } from '../config/env.schema.js';

export type Auth = ReturnType<typeof createAuth>;

export function createAuth(
  config: Pick<
    Env,
    | 'BETTER_AUTH_SECRET'
    | 'BETTER_AUTH_URL'
    | 'GOOGLE_CLIENT_ID'
    | 'GOOGLE_CLIENT_SECRET'
    | 'WEB_ORIGIN'
  >,
  prisma: PrismaClient,
) {
  return betterAuth({
    basePath: '/api/auth',
    baseURL: config.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    plugins: [bearer()],
    secret: config.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
      },
    },
    trustedOrigins: parseTrustedOrigins(config.WEB_ORIGIN),
  });
}
