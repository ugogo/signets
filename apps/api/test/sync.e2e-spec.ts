import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

const hasE2eEnv =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.DIRECT_URL) &&
  Boolean(process.env.SYNC_TOKEN) &&
  Boolean(process.env.WEB_ORIGIN);

const describeE2e = hasE2eEnv ? describe : describe.skip;

describeE2e('Sync and shots (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
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
    await request(app.getHttpServer())
      .post('/sync')
      .send({ shots: [] })
      .expect(401);
  });

  it('lists shots publicly', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        nextCursor: null,
        total: expect.any(Number),
      }),
    );
  });

  it('rejects an invalid shots cursor', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots')
      .query({ cursor: 'not-a-cursor' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        error: 'Validation failed',
        issues: expect.any(Array),
        statusCode: 400,
      }),
    );
  });

  it('rejects an invalid shots limit', async () => {
    await request(app.getHttpServer())
      .get('/shots')
      .query({ limit: '999' })
      .expect(400);
  });

  it('lists shot authors publicly', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots/authors')
      .expect(200);

    expect(response.body).toEqual(expect.any(Array));
  });
});
