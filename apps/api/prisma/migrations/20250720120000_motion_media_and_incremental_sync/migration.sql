-- CreateEnum
CREATE TYPE "ShotKind" AS ENUM ('photo', 'video', 'animated_gif');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastBookmarkSyncAt" TIMESTAMPTZ(6);

-- AlterTable: add new media-centric columns
ALTER TABLE "Shot" ADD COLUMN "postId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "mediaId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "kind" "ShotKind";
ALTER TABLE "Shot" ADD COLUMN "mediaUrl" TEXT;
ALTER TABLE "Shot" ADD COLUMN "mediaPosterUrl" TEXT;

-- Backfill from legacy image-specific columns
UPDATE "Shot"
SET
  "postId" = "xPostId",
  "mediaUrl" = "imageUrl",
  "mediaId" = COALESCE(
    NULLIF(substring("imageUrl" from '/media/([^/?]+)'), ''),
    "xPostId" || ':' || "imageIndex"::text
  ),
  "kind" = 'photo'::"ShotKind";

ALTER TABLE "Shot" ALTER COLUMN "postId" SET NOT NULL;
ALTER TABLE "Shot" ALTER COLUMN "mediaId" SET NOT NULL;
ALTER TABLE "Shot" ALTER COLUMN "kind" SET NOT NULL;
ALTER TABLE "Shot" ALTER COLUMN "mediaUrl" SET NOT NULL;

-- Drop legacy unique constraint and columns
DROP INDEX "Shot_userId_xPostId_imageIndex_key";
ALTER TABLE "Shot" DROP COLUMN "xPostId";
ALTER TABLE "Shot" DROP COLUMN "imageUrl";
ALTER TABLE "Shot" DROP COLUMN "imageIndex";

-- CreateIndex
CREATE UNIQUE INDEX "Shot_userId_mediaId_key" ON "Shot"("userId", "mediaId");
