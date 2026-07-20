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
import type {
  ListShotAuthorsQuery,
  ListShotsQuery,
  ShotIdParam,
} from '@signets/shared';
import {
  listShotAuthorsQueryParsedSchema,
  listShotsQueryParsedSchema,
  shotIdParamSchema,
} from '@signets/shared';

import { SyncTokenGuard } from '../auth/sync-token.guard.js';
import { zodPipe } from '../common/zod-validation.pipe.js';
import { ShotsService } from './shots.service.js';

@Controller('shots')
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  @Get()
  list(
    @Query(zodPipe(listShotsQueryParsedSchema))
    filters: ListShotsQuery,
  ) {
    return this.shotsService.list(filters);
  }

  @Get('authors')
  listAuthors(
    @Query(zodPipe(listShotAuthorsQueryParsedSchema))
    filters: ListShotAuthorsQuery,
  ) {
    return this.shotsService.listAuthors(filters);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(SyncTokenGuard)
  async remove(@Param(zodPipe(shotIdParamSchema)) params: ShotIdParam) {
    const deleted = await this.shotsService.remove(params.id);
    if (!deleted) {
      throw new NotFoundException('Shot not found');
    }
    return { deleted: true as const };
  }

  @Patch(':id/favorite')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(SyncTokenGuard)
  async toggleFavorite(
    @Param(zodPipe(shotIdParamSchema)) params: ShotIdParam,
  ) {
    const shot = await this.shotsService.toggleFavorite(params.id);
    if (!shot) {
      throw new NotFoundException('Shot not found');
    }
    return shot;
  }
}
