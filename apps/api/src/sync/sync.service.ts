import type { SyncPayload, SyncResult, SyncState } from '@signets/shared';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  async getState(): Promise<SyncState> {
    const user = await this.ensureUser();

    return {
      lastBookmarkSyncAt: user.lastBookmarkSyncAt?.toISOString() ?? null,
    };
  }

  async upsertShots(payload: SyncPayload): Promise<SyncResult> {
    const user = await this.ensureUser();

    const newestBookmarkedAt = payload.shots.reduce((latest, shot) => {
      const at = new Date(shot.bookmarkedAt);
      return at > latest ? at : latest;
    }, new Date(0));

    const previousLastBookmarkSyncAt = user.lastBookmarkSyncAt ?? new Date(0);
    const lastBookmarkSyncAt =
      newestBookmarkedAt > previousLastBookmarkSyncAt
        ? newestBookmarkedAt
        : previousLastBookmarkSyncAt;

    await this.prisma.$transaction([
      ...payload.shots.map((shot) =>
        this.prisma.shot.upsert({
          create: {
            authorHandle: shot.authorHandle,
            authorName: shot.authorName ?? null,
            bookmarkedAt: new Date(shot.bookmarkedAt),
            caption: shot.caption ?? null,
            height: shot.height ?? null,
            kind: shot.kind,
            mediaId: shot.mediaId,
            mediaPosterUrl: shot.mediaPosterUrl ?? null,
            mediaUrl: shot.mediaUrl,
            postId: shot.postId,
            userId: user.id,
            width: shot.width ?? null,
          },
          update: {
            authorHandle: shot.authorHandle,
            authorName: shot.authorName ?? null,
            bookmarkedAt: new Date(shot.bookmarkedAt),
            caption: shot.caption ?? null,
            height: shot.height ?? null,
            kind: shot.kind,
            mediaPosterUrl: shot.mediaPosterUrl ?? null,
            mediaUrl: shot.mediaUrl,
            postId: shot.postId,
            width: shot.width ?? null,
          },
          where: {
            userId_mediaId: {
              mediaId: shot.mediaId,
              userId: user.id,
            },
          },
        }),
      ),
      this.prisma.user.update({
        data: { lastBookmarkSyncAt },
        where: { id: user.id },
      }),
    ]);

    return {
      lastBookmarkSyncAt: lastBookmarkSyncAt.toISOString(),
      upserted: payload.shots.length,
    };
  }

  private async ensureUser() {
    return this.prisma.user.upsert({
      create: { slug: this.userSlug },
      update: {},
      where: { slug: this.userSlug },
    });
  }
}
