import type { SyncPayload, SyncResult, SyncState } from '@signets/shared';

import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(userId: string): Promise<SyncState> {
    const user = await this.findUser(userId);

    return {
      lastBookmarkSyncAt: user.lastBookmarkSyncAt?.toISOString() ?? null,
    };
  }

  async upsertShots(userId: string, payload: SyncPayload): Promise<SyncResult> {
    const user = await this.findUser(userId);

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
            userId,
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
              userId,
            },
          },
        }),
      ),
      this.prisma.user.update({
        data: { lastBookmarkSyncAt },
        where: { id: userId },
      }),
    ]);

    return {
      lastBookmarkSyncAt: lastBookmarkSyncAt.toISOString(),
      upserted: payload.shots.length,
    };
  }

  private async findUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
