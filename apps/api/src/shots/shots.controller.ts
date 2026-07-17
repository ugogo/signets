import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { listShotsQuerySchema, parseListShotsQuery } from '@signets/shared';

import { SyncTokenGuard } from '../auth/sync-token.guard.js';
import { ShotsService } from './shots.service.js';

@Controller('shots')
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    const parsed = listShotsQuerySchema.safeParse(query);
    const filters = parsed.success ? parseListShotsQuery(parsed.data) : {};
    return this.shotsService.list(filters);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(SyncTokenGuard)
  async remove(@Param('id') id: string) {
    const deleted = await this.shotsService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Shot not found');
    }
    return { deleted: true };
  }

  @Patch(':id/favorite')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(SyncTokenGuard)
  async toggleFavorite(@Param('id') id: string) {
    const shot = await this.shotsService.toggleFavorite(id);
    if (!shot) {
      throw new NotFoundException('Shot not found');
    }
    return shot;
  }
}
