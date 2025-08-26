import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
    }
  }
});

async function main() {
  // IDs de los usuarios
  const farcasterUserId = 'cmejzw1ea0000l104f48mvrkb'; // gotoalberto
  const googleUserId = 'cmem04y350000kv04urit7pga'; // albertogomeztoribio
  
  console.log('Transfiriendo drops de Instagram al usuario gotoalberto...');
  
  // Actualizar todos los drops del usuario albertogomeztoribio al usuario gotoalberto
  const result = await prisma.drop.updateMany({
    where: {
      userId: googleUserId,
      platform: 'instagram'
    },
    data: {
      userId: farcasterUserId
    }
  });
  
  console.log(`\nActualizados ${result.count} drops de Instagram`);
  
  // Verificar los drops del usuario gotoalberto
  const updatedUser = await prisma.user.findUnique({
    where: { id: farcasterUserId },
    include: {
      drops: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
  
  console.log(`\nEl usuario gotoalberto ahora tiene ${updatedUser?.drops.length} drops:`);
  updatedUser?.drops.forEach((drop, index) => {
    console.log(`${index + 1}. Platform: ${drop.platform}, Created: ${drop.createdAt}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });