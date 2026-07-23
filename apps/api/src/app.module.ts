import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.schema.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ShotsModule } from './shots/shots.module.js';
import { SyncModule } from './sync/sync.module.js';
import { XMediaModule } from './x-media/x-media.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        limit: 120,
        name: 'default',
        ttl: 60_000,
      },
    ]),
    AuthModule,
    PrismaModule,
    HealthModule,
    XMediaModule,
    SyncModule,
    ShotsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
