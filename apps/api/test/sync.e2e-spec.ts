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

    const response = await request(app.getHttpServer()).get('/shots').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        nextCursor: null,
        total: expect.any(Number),
      }),
    );
  });

  it('rejects an invalid shots cursor', async () => {
    if (!app) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/shots')
      .query({ cursor: 'not-a-cursor' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        error: 'Validation failed',
        issues: expect.any(Array),
      }),
    );
  });

  it('rejects an invalid shots limit', async () => {
    if (!app) {
      return;
    }

    await request(app.getHttpServer())
      .get('/shots')
      .query({ limit: '999' })
      .expect(400);
  });

  it('lists shot authors publicly', async () => {
    if (!app) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/shots/authors')
      .expect(200);

    expect(response.body).toEqual(expect.any(Array));
  });
});
