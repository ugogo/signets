import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

describe('Sync and shots (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    if (
      !process.env.DATABASE_URL ||
      !process.env.DIRECT_URL ||
      !process.env.SYNC_TOKEN ||
      !process.env.WEB_ORIGIN
    ) {
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects sync without token', async () => {
    if (!app) {
      return;
    }

    await request(app.getHttpServer())
      .post('/sync')
      .send({ shots: [] })
      .expect(401);
  });

  it('lists shots publicly', async () => {
    if (!app) {
      return;
    }

    await request(app.getHttpServer()).get('/shots').expect(200);
  });
});
