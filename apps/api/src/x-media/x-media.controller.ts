import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { XMediaService } from './x-media.service.js';

@Controller('x/media')
export class XMediaController {
  constructor(private readonly xMediaService: XMediaService) {}

  @Get()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async proxy(
    @Query('url') url: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!url) {
      throw new BadRequestException('Missing url parameter');
    }

    await this.xMediaService.pipe(url, req, res);
  }
}
