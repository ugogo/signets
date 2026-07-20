import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { SyncPayload, SyncVerifyResponse } from '@signets/shared';
import { syncPayloadSchema } from '@signets/shared';

import { SyncTokenGuard } from '../auth/sync-token.guard.js';
import { zodPipe } from '../common/zod-validation.pipe.js';
import { SyncService } from './sync.service.js';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('verify')
  @UseGuards(SyncTokenGuard)
  verify(): SyncVerifyResponse {
    return { ok: true };
  }

  @Get('state')
  @UseGuards(SyncTokenGuard)
  state() {
    return this.syncService.getState();
  }

  @Post()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @UseGuards(SyncTokenGuard)
  async sync(@Body(zodPipe(syncPayloadSchema)) payload: SyncPayload) {
    return this.syncService.upsertShots(payload);
  }
}
