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
    console.log('=== Aplicando migración para Instagram Drops ===\n');
    
    // 1. Add new columns to Drop table
    console.log('1. Agregando columnas a la tabla Drop...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Drop" 
      ADD COLUMN IF NOT EXISTS "instagramAccountId" TEXT,
      ADD COLUMN IF NOT EXISTS "instagramStoryId" TEXT,
      ADD COLUMN IF NOT EXISTS "instagramStoryUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "acceptedFormats" TEXT[] DEFAULT ARRAY['email']::TEXT[],
      ADD COLUMN IF NOT EXISTS "sendPoapEmail" BOOLEAN DEFAULT true
    `);
    console.log('✓ Columnas agregadas a Drop');

    // 2. Add indexes to Drop table
    console.log('\n2. Agregando índices a la tabla Drop...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Drop_instagramAccountId_idx" ON "Drop"("instagramAccountId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Drop_instagramStoryId_idx" ON "Drop"("instagramStoryId")
    `);
    console.log('✓ Índices agregados a Drop');

    // 3. Update InstagramMessage table
    console.log('\n3. Actualizando tabla InstagramMessage...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InstagramMessage" 
      ADD COLUMN IF NOT EXISTS "processed" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "dropId" TEXT
    `);
    console.log('✓ Columnas agregadas a InstagramMessage');

    // 4. Add indexes to InstagramMessage
    console.log('\n4. Agregando índices a InstagramMessage...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_processed_idx" ON "InstagramMessage"("processed")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_storyId_idx" ON "InstagramMessage"("storyId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramMessage_dropId_idx" ON "InstagramMessage"("dropId")
    `);
    console.log('✓ Índices agregados a InstagramMessage');

    // 5. Create InstagramAccount table
    console.log('\n5. Creando tabla InstagramAccount...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InstagramAccount" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "instagramId" TEXT NOT NULL,
        "username" TEXT,
        "accessToken" TEXT NOT NULL,
        "tokenType" TEXT NOT NULL DEFAULT 'bearer',
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "InstagramAccount_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InstagramAccount_instagramId_key" UNIQUE ("instagramId")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramAccount_instagramId_idx" ON "InstagramAccount"("instagramId")
    `);
    console.log('✓ Tabla InstagramAccount creada');

    // 6. Create InstagramDropMessages table
    console.log('\n6. Creando tabla InstagramDropMessages...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InstagramDropMessages" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "dropId" TEXT NOT NULL,
        "successMessage" TEXT NOT NULL,
        "alreadyClaimedMessage" TEXT NOT NULL,
        "invalidFormatMessage" TEXT NOT NULL,
        
        CONSTRAINT "InstagramDropMessages_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InstagramDropMessages_dropId_key" UNIQUE ("dropId")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramDropMessages_dropId_idx" ON "InstagramDropMessages"("dropId")
    `);
    console.log('✓ Tabla InstagramDropMessages creada');

    // 7. Create InstagramDelivery table
    console.log('\n7. Creando tabla InstagramDelivery...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InstagramDelivery" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "dropId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "recipientType" TEXT NOT NULL,
        "recipientValue" TEXT NOT NULL,
        "poapLink" TEXT,
        "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
        "errorMessage" TEXT,
        "deliveredAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "InstagramDelivery_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InstagramDelivery_messageId_key" UNIQUE ("messageId"),
        CONSTRAINT "InstagramDelivery_dropId_recipientValue_recipientType_key" UNIQUE ("dropId", "recipientValue", "recipientType")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramDelivery_dropId_idx" ON "InstagramDelivery"("dropId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramDelivery_messageId_idx" ON "InstagramDelivery"("messageId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InstagramDelivery_deliveryStatus_idx" ON "InstagramDelivery"("deliveryStatus")
    `);
    console.log('✓ Tabla InstagramDelivery creada');

    // 8. Add foreign keys
    console.log('\n8. Agregando foreign keys...');
    
    // Drop table foreign key
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'Drop_instagramAccountId_fkey'
        ) THEN
          ALTER TABLE "Drop" 
          ADD CONSTRAINT "Drop_instagramAccountId_fkey" 
          FOREIGN KEY ("instagramAccountId") 
          REFERENCES "InstagramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    
    // InstagramDropMessages foreign key
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'InstagramDropMessages_dropId_fkey'
        ) THEN
          ALTER TABLE "InstagramDropMessages" 
          ADD CONSTRAINT "InstagramDropMessages_dropId_fkey" 
          FOREIGN KEY ("dropId") 
          REFERENCES "Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    
    // InstagramDelivery foreign keys
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'InstagramDelivery_dropId_fkey'
        ) THEN
          ALTER TABLE "InstagramDelivery" 
          ADD CONSTRAINT "InstagramDelivery_dropId_fkey" 
          FOREIGN KEY ("dropId") 
          REFERENCES "Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'InstagramDelivery_messageId_fkey'
        ) THEN
          ALTER TABLE "InstagramDelivery" 
          ADD CONSTRAINT "InstagramDelivery_messageId_fkey" 
          FOREIGN KEY ("messageId") 
          REFERENCES "InstagramMessage"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    
    console.log('✓ Foreign keys agregadas');

    console.log('\n✅ Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();