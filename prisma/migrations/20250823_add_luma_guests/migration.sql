-- CreateTable
CREATE TABLE "LumaGuest" (
    "id" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "ethAddress" TEXT,
    "solanaAddress" TEXT,
    "phoneNumber" TEXT,
    "geoCity" TEXT,
    "geoCountry" TEXT,
    "avatarUrl" TEXT,
    "twitterHandle" TEXT,
    "instagramHandle" TEXT,
    "linkedinHandle" TEXT,
    "website" TEXT,
    "approvalStatus" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LumaGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LumaGuest_dropId_guestId_key" ON "LumaGuest"("dropId", "guestId");

-- CreateIndex
CREATE INDEX "LumaGuest_dropId_idx" ON "LumaGuest"("dropId");

-- CreateIndex
CREATE INDEX "LumaGuest_email_idx" ON "LumaGuest"("email");

-- CreateIndex
CREATE INDEX "LumaGuest_checkedInAt_idx" ON "LumaGuest"("checkedInAt");

-- AddForeignKey
ALTER TABLE "LumaGuest" ADD CONSTRAINT "LumaGuest_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;