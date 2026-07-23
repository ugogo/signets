import type { SyncPayload } from '@signets/shared';

import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { syncPayloadSchema } from '@signets/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { SyncVerifyResponse } from './sync.schema.js';

import { requireUserId } from '../auth/session-user.js';
import { zodPipe } from '../common/zod-validation.pipe.js';
import { SyncService } from './sync.service.js';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('state')
  state(@Session() session: UserSession) {
    return this.syncService.getState(requireUserId(session));
  }

  @Post()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async sync(
    @Session() session: UserSession,
    @Body(zodPipe(syncPayloadSchema)) payload: SyncPayload,
  ) {
    return this.syncService.upsertShots(requireUserId(session), payload);
  }

  @Get('verify')
  verify(): SyncVerifyResponse {
    return { ok: true };
  }
}
