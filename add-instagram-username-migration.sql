-- Add senderUsername column to InstagramMessage table
ALTER TABLE "InstagramMessage" ADD COLUMN "senderUsername" TEXT;

-- Create index on senderUsername for better query performance
CREATE INDEX "InstagramMessage_senderUsername_idx" ON "InstagramMessage"("senderUsername");