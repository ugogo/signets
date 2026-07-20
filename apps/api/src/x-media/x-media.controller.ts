import {
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { XMediaQuery } from '@signets/shared';
import { xMediaQuerySchema } from '@signets/shared';
import type { Request, Response } from 'express';

import { zodPipe } from '../common/zod-validation.pipe.js';
import { XMediaService } from './x-media.service.js';

@Controller('x/media')
export class XMediaController {
  constructor(private readonly xMediaService: XMediaService) {}

  @Get()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async proxy(
    @Query(zodPipe(xMediaQuerySchema)) query: XMediaQuery,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.xMediaService.pipe(query.url, req, res);
  }
}
