-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "xPostId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "hostedImageKey" TEXT,
    "imageIndex" INTEGER NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorName" TEXT,
    "caption" TEXT,
    "bookmarkedAt" TIMESTAMPTZ(6) NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- CreateIndex
CREATE INDEX "Shot_userId_bookmarkedAt_idx" ON "Shot"("userId", "bookmarkedAt");

-- CreateIndex
CREATE INDEX "Shot_userId_authorHandle_idx" ON "Shot"("userId", "authorHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Shot_userId_xPostId_imageIndex_key" ON "Shot"("userId", "xPostId", "imageIndex");

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
