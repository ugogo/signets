import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { type Env, parseWebOrigins } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '1mb' });
  app.enableShutdownHooks();

  const httpAdapter = app.getHttpAdapter().getInstance() as {
    set?: (key: string, value: number) => void;
  };
  if (typeof httpAdapter.set === 'function') {
    httpAdapter.set('trust proxy', 1);
  }

  const config = app.get(ConfigService<Env, true>);
  const webOrigins = parseWebOrigins(config.get('WEB_ORIGIN', { infer: true }));

  app.enableCors({
    origin: webOrigins,
  });

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}
void bootstrap();
