import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, Shot as PrismaShot } from '@prisma/client';
import type { ListShotsQuery, Shot } from '@signets/shared';
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

  async list(filters: ListShotsQuery): Promise<Shot[]> {
    const user = await this.getUser();
    if (!user) {
      return [];
    }

    const where: Prisma.ShotWhereInput = {
      userId: user.id,
    };

    if (filters.favorites === true) {
      where.isFavorite = true;
    }

    if (filters.author) {
      where.authorHandle = filters.author;
    }

    if (filters.search) {
      where.OR = [
        { caption: { contains: filters.search, mode: 'insensitive' } },
        { authorHandle: { contains: filters.search, mode: 'insensitive' } },
        { authorName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.shot.findMany({
      orderBy: { bookmarkedAt: 'desc' },
      where,
    });

    return rows.map(toShotDto);
  }

  async toggleFavorite(id: string): Promise<Shot | null> {
    const user = await this.getUser();
    if (!user) {
      return null;
    }

    const existing = await this.prisma.shot.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.shot.update({
      data: { isFavorite: !existing.isFavorite },
      where: { id },
    });

    return toShotDto(updated);
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
    id: row.id,
    imageIndex: row.imageIndex,
    imageUrl: row.imageUrl,
    isFavorite: row.isFavorite,
    updatedAt: row.updatedAt.toISOString(),
    xPostId: row.xPostId,
  };
}
