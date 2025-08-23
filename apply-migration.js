const { PrismaClient } = require('@prisma/client');

async function applyMigration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
      }
    }
  });

  try {
    console.log('Aplicando migración de LumaCookie...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "LumaCookie" (
        "id" TEXT NOT NULL,
        "cookie" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "isValid" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "LumaCookie_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "LumaCookie_createdAt_idx" ON "LumaCookie"("createdAt")
    `;
    
    console.log('Migración aplicada exitosamente!');
    
    // Verificar que la tabla existe
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'LumaCookie'
    `;
    
    console.log('Tabla LumaCookie creada:', tables.length > 0);
    
  } catch (error) {
    console.error('Error aplicando migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();