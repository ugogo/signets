import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, Shot as PrismaShot } from '@prisma/client';
import type {
  ListShotAuthorsQuery,
  ListShotsQuery,
  ListShotsResponse,
  Shot,
  ShotCursor,
} from '@signets/shared';
import {
  decodeShotCursor,
  encodeShotCursor,
  SHOTS_PAGE_SIZE,
} from '@signets/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShotsService {
  private readonly userSlug: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.userSlug = config.get<string>('USER_SLUG') ?? 'default';
  }

  async list(filters: ListShotsQuery): Promise<ListShotsResponse> {
    const user = await this.getUser();
    if (!user) {
      return { items: [], nextCursor: null, total: 0 };
    }

    const limit = filters.limit ?? SHOTS_PAGE_SIZE;
    const baseWhere = this.buildShotWhere(user.id, filters);
    const cursor = this.parseCursor(filters.cursor);
    const where = cursor ? this.applyCursor(baseWhere, cursor) : baseWhere;
    const isFirstPage = !filters.cursor;

    const [rows, total] = await Promise.all([
      this.prisma.shot.findMany({
        orderBy: [{ bookmarkedAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        where,
      }),
      isFirstPage
        ? this.prisma.shot.count({ where: baseWhere })
        : Promise.resolve(undefined),
    ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = pageRows.map(toShotDto);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor:
        hasMore && lastItem
          ? encodeShotCursor({
              bookmarkedAt: lastItem.bookmarkedAt,
              id: lastItem.id,
            })
          : null,
      ...(total !== undefined ? { total } : {}),
    };
  }

  async listAuthors(filters: ListShotAuthorsQuery): Promise<string[]> {
    const user = await this.getUser();
    if (!user) {
      return [];
    }

    const where = this.buildShotWhere(user.id, filters);
    const groups = await this.prisma.shot.groupBy({
      by: ['authorHandle'],
      orderBy: { authorHandle: 'asc' },
      where,
    });

    return groups.map((group) => group.authorHandle);
  }

  async toggleFavorite(id: string): Promise<Shot | null> {
    const user = await this.getUser();
    if (!user) {
      return null;
    }

    const rows = await this.prisma.$queryRaw<PrismaShot[]>`
      UPDATE "Shot"
      SET "isFavorite" = NOT "isFavorite", "updatedAt" = NOW()
      WHERE "id" = ${id}::uuid AND "userId" = ${user.id}::uuid
      RETURNING *
    `;

    const updated = rows[0];
    return updated ? toShotDto(updated) : null;
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.getUser();
    if (!user) {
      return false;
    }

    const deleted = await this.prisma.shot.deleteMany({
      where: { id, userId: user.id },
    });

    return deleted.count > 0;
  }

  private parseCursor(cursor: string | undefined): ShotCursor | undefined {
    if (!cursor) {
      return undefined;
    }

    return decodeShotCursor(cursor) ?? undefined;
  }

  private buildShotWhere(
    userId: string,
    filters: ListShotsQuery | ListShotAuthorsQuery,
  ): Prisma.ShotWhereInput {
    const where: Prisma.ShotWhereInput = {
      userId,
    };

    if (filters.favorites === true) {
      where.isFavorite = true;
    }

    if ('author' in filters && filters.author) {
      where.authorHandle = filters.author;
    }

    if (filters.search) {
      where.OR = [
        { caption: { contains: filters.search, mode: 'insensitive' } },
        { authorHandle: { contains: filters.search, mode: 'insensitive' } },
        { authorName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private applyCursor(
    where: Prisma.ShotWhereInput,
    cursor: ShotCursor,
  ): Prisma.ShotWhereInput {
    const cursorDate = new Date(cursor.bookmarkedAt);

    return {
      AND: [
        where,
        {
          OR: [
            { bookmarkedAt: { lt: cursorDate } },
            {
              bookmarkedAt: cursorDate,
              id: { lt: cursor.id },
            },
          ],
        },
      ],
    };
  }

  private async getUser() {
    return this.prisma.user.findUnique({
      where: { slug: this.userSlug },
    });
  }
}

function toShotDto(row: PrismaShot): Shot {
  return {
    authorHandle: row.authorHandle,
    authorName: row.authorName,
    bookmarkedAt: row.bookmarkedAt.toISOString(),
    caption: row.caption,
    createdAt: row.createdAt.toISOString(),
    height: row.height,
    id: row.id,
    isFavorite: row.isFavorite,
    kind: row.kind,
    mediaId: row.mediaId,
    mediaPosterUrl: row.mediaPosterUrl,
    mediaUrl: row.mediaUrl,
    postId: row.postId,
    updatedAt: row.updatedAt.toISOString(),
    width: row.width,
  };
}
