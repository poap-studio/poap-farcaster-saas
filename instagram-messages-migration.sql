-- Create InstagramMessage table
CREATE TABLE IF NOT EXISTS "InstagramMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "storyId" TEXT,
    "storyUrl" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramMessage_pkey" PRIMARY KEY ("id")
);

-- Create unique index on messageId
CREATE UNIQUE INDEX IF NOT EXISTS "InstagramMessage_messageId_key" ON "InstagramMessage"("messageId");

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS "InstagramMessage_senderId_idx" ON "InstagramMessage"("senderId");
CREATE INDEX IF NOT EXISTS "InstagramMessage_recipientId_idx" ON "InstagramMessage"("recipientId");
CREATE INDEX IF NOT EXISTS "InstagramMessage_timestamp_idx" ON "InstagramMessage"("timestamp");
CREATE INDEX IF NOT EXISTS "InstagramMessage_createdAt_idx" ON "InstagramMessage"("createdAt");