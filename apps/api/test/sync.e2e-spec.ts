import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const hasE2eEnv =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.DIRECT_URL) &&
  Boolean(process.env.BETTER_AUTH_SECRET) &&
  Boolean(process.env.BETTER_AUTH_URL) &&
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
  Boolean(process.env.WEB_ORIGIN);

const describeE2e = hasE2eEnv ? describe : describe.skip;

describeE2e('Auth-protected sync and shots (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sessionToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    sessionToken = await createTestSession(prisma);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany();
    await app?.close();
  });

  it('rejects sync without session', async () => {
    await request(app.getHttpServer())
      .post('/sync')
      .send({ shots: [] })
      .expect(401);
  });

  it('rejects shots listing without session', async () => {
    await request(app.getHttpServer()).get('/shots').expect(401);
  });

  it('lists shots with a bearer session', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots')
      .set('Authorization', `Bearer ${sessionToken}`)
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
      .set('Authorization', `Bearer ${sessionToken}`)
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
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(400);
  });

  it('lists shot authors with a bearer session', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots/authors')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(200);

    expect(response.body).toEqual(expect.any(Array));
  });

  it('allows anonymous health checks', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });
});

async function createTestSession(prisma: PrismaService): Promise<string> {
  const userId = 'e2e-user';
  const token = `e2e-session-${Date.now()}`;

  await prisma.user.deleteMany({ where: { email: 'e2e@signets.test' } });

  await prisma.user.create({
    data: {
      createdAt: new Date(),
      email: 'e2e@signets.test',
      emailVerified: true,
      id: userId,
      name: 'E2E User',
      updatedAt: new Date(),
    },
  });

  await prisma.session.create({
    data: {
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      id: 'e2e-session',
      token,
      updatedAt: new Date(),
      userId,
    },
  });

  return token;
}
