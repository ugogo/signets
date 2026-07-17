import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SyncPayload } from '@signets/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SyncService {
  private readonly userSlug: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.userSlug = config.get<string>('USER_SLUG') ?? 'default';
  }

  async upsertShots(payload: SyncPayload) {
    const user = await this.ensureUser();

    await this.prisma.$transaction(
      payload.shots.map((shot) =>
        this.prisma.shot.upsert({
          create: {
            authorHandle: shot.authorHandle,
            authorName: shot.authorName ?? null,
            bookmarkedAt: new Date(shot.bookmarkedAt),
            caption: shot.caption ?? null,
            imageIndex: shot.imageIndex,
            imageUrl: shot.imageUrl,
            userId: user.id,
            xPostId: shot.xPostId,
          },
          update: {
            authorHandle: shot.authorHandle,
            authorName: shot.authorName ?? null,
            bookmarkedAt: new Date(shot.bookmarkedAt),
            caption: shot.caption ?? null,
            imageUrl: shot.imageUrl,
          },
          where: {
            userId_xPostId_imageIndex: {
              imageIndex: shot.imageIndex,
              userId: user.id,
              xPostId: shot.xPostId,
            },
          },
        }),
      ),
    );

    return { upserted: payload.shots.length };
  }

  private async ensureUser() {
    return this.prisma.user.upsert({
      create: { slug: this.userSlug },
      update: {},
      where: { slug: this.userSlug },
    });
  }
}
