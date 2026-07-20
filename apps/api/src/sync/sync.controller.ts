import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { syncPayloadSchema } from '@signets/shared';

import { SyncTokenGuard } from '../auth/sync-token.guard.js';
import { SyncService } from './sync.service.js';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('verify')
  @UseGuards(SyncTokenGuard)
  verify() {
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
  async sync(@Body() body: unknown) {
    const parsed = syncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return this.syncService.upsertShots(parsed.data);
  }
}
