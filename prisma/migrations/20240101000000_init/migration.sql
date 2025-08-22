-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fid" INTEGER,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "googleId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'farcaster',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Drop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poapEventId" TEXT NOT NULL,
    "poapSecretCode" TEXT NOT NULL,
    "buttonColor" TEXT NOT NULL DEFAULT '#0a5580',
    "backgroundColor" TEXT NOT NULL DEFAULT '#073d5c',
    "logoUrl" TEXT,
    "mintMessage" TEXT NOT NULL DEFAULT 'This POAP celebrates the Farcaster community and our journey together.',
    "requireFollow" BOOLEAN NOT NULL DEFAULT true,
    "followUsername" TEXT,
    "requireRecast" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disclaimerMessage" TEXT NOT NULL DEFAULT 'By minting this POAP you accept these terms: https://poap.xyz/terms',
    "requireQuote" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Claim" (
    "id" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "fid" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT,
    "followers" INTEGER,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_fid_key" ON "public"."User"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Drop_slug_key" ON "public"."Drop"("slug");

-- CreateIndex
CREATE INDEX "Drop_userId_idx" ON "public"."Drop"("userId");

-- CreateIndex
CREATE INDEX "Drop_slug_idx" ON "public"."Drop"("slug");

-- CreateIndex
CREATE INDEX "Claim_dropId_idx" ON "public"."Claim"("dropId");

-- CreateIndex
CREATE INDEX "Claim_fid_idx" ON "public"."Claim"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_dropId_fid_key" ON "public"."Claim"("dropId", "fid");

-- AddForeignKey
ALTER TABLE "public"."Drop" ADD CONSTRAINT "Drop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Claim" ADD CONSTRAINT "Claim_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "public"."Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

