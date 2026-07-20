import { Module } from '@nestjs/common';

import { XMediaController } from './x-media.controller.js';
import { XMediaService } from './x-media.service.js';

@Module({
  controllers: [XMediaController],
  providers: [XMediaService],
})
export class XMediaModule {}
