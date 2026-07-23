import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';

import { type Env, parseWebOrigins } from '../config/env.schema.js';

const authPrisma = new PrismaClient();

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
) {
  return betterAuth({
    basePath: '/api/auth',
    baseURL: config.BETTER_AUTH_URL,
    database: prismaAdapter(authPrisma, {
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
    trustedOrigins: parseWebOrigins(config.WEB_ORIGIN),
  });
}
