import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { type Env } from '../config/env.schema.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuth } from './auth.js';
import { ExtensionAuthController } from './extension-auth.controller.js';

@Global()
@Module({
  controllers: [ExtensionAuthController],
  exports: [BetterAuthModule],
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [ConfigService, PrismaService],
      useFactory: (config: ConfigService<Env, true>, prisma: PrismaService) => {
        const auth = createAuth(
          {
            BETTER_AUTH_SECRET: config.get('BETTER_AUTH_SECRET', {
              infer: true,
            }),
            BETTER_AUTH_URL: config.get('BETTER_AUTH_URL', { infer: true }),
            GOOGLE_CLIENT_ID: config.get('GOOGLE_CLIENT_ID', { infer: true }),
            GOOGLE_CLIENT_SECRET: config.get('GOOGLE_CLIENT_SECRET', {
              infer: true,
            }),
            WEB_ORIGIN: config.get('WEB_ORIGIN', { infer: true }),
          },
          prisma,
        );

        return {
          auth,
          bodyParser: {
            json: { limit: '1mb' },
            urlencoded: { enabled: true, extended: true, limit: '1mb' },
          },
        };
      },
    }),
  ],
})
export class AuthModule {}
