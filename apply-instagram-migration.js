const { PrismaClient } = require('@prisma/client');

async function applyInstagramMigration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
      }
    }
  });

  try {
    console.log('Aplicando migración de InstagramMessage...');
    
    // Create InstagramMessage table
    await prisma.$executeRaw`
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
      )
    `;
    
    // Create unique index on messageId
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "InstagramMessage_messageId_key" ON "InstagramMessage"("messageId")
    `;
    
    // Create indexes for queries
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_senderId_idx" ON "InstagramMessage"("senderId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_recipientId_idx" ON "InstagramMessage"("recipientId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_timestamp_idx" ON "InstagramMessage"("timestamp")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_createdAt_idx" ON "InstagramMessage"("createdAt")
    `;
    
    console.log('Migración aplicada exitosamente!');
    
    // Verificar que la tabla existe
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InstagramMessage'
    `;
    
    console.log('Tabla InstagramMessage creada:', tables.length > 0);
    
    // Mostrar estructura de la tabla
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'InstagramMessage' 
      ORDER BY ordinal_position
    `;
    
    console.log('Columnas de la tabla:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error aplicando migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyInstagramMigration();