-- AlterTable
ALTER TABLE "Drop" ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'farcaster',
ADD COLUMN     "lumaEventId" TEXT,
ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "lumaEventUrl" TEXT,
ADD COLUMN     "emailSubject" TEXT,
ADD COLUMN     "emailBody" TEXT,
ADD COLUMN     "deliveryTarget" TEXT NOT NULL DEFAULT 'email';

-- CreateIndex
CREATE INDEX "Drop_platform_idx" ON "Drop"("platform");