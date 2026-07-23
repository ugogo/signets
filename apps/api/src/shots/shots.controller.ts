import type {
  ListShotAuthorsQuery,
  ListShotsQuery,
  ShotIdParam,
} from '@signets/shared';

import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  listShotAuthorsQueryParsedSchema,
  listShotsQueryParsedSchema,
  shotIdParamSchema,
} from '@signets/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { requireUserId } from '../auth/session-user.js';
import { zodPipe } from '../common/zod-validation.pipe.js';
import { ShotsService } from './shots.service.js';

@Controller('shots')
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  @Get()
  list(
    @Session() session: UserSession,
    @Query(zodPipe(listShotsQueryParsedSchema))
    filters: ListShotsQuery,
  ) {
    return this.shotsService.list(requireUserId(session), filters);
  }

  @Get('authors')
  listAuthors(
    @Session() session: UserSession,
    @Query(zodPipe(listShotAuthorsQueryParsedSchema))
    filters: ListShotAuthorsQuery,
  ) {
    return this.shotsService.listAuthors(requireUserId(session), filters);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async remove(
    @Session() session: UserSession,
    @Param(zodPipe(shotIdParamSchema)) params: ShotIdParam,
  ) {
    const deleted = await this.shotsService.remove(
      requireUserId(session),
      params.id,
    );
    if (!deleted) {
      throw new NotFoundException('Shot not found');
    }
    return { deleted: true as const };
  }

  @Patch(':id/favorite')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async toggleFavorite(
    @Session() session: UserSession,
    @Param(zodPipe(shotIdParamSchema)) params: ShotIdParam,
  ) {
    const shot = await this.shotsService.toggleFavorite(
      requireUserId(session),
      params.id,
    );
    if (!shot) {
      throw new NotFoundException('Shot not found');
    }
    return shot;
  }
}
