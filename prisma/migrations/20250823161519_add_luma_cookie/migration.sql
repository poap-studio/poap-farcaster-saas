-- CreateTable
CREATE TABLE "LumaCookie" (
    "id" TEXT NOT NULL,
    "cookie" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LumaCookie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LumaCookie_createdAt_idx" ON "LumaCookie"("createdAt");