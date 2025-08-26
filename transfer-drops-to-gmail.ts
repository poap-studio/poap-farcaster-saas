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
  const farcasterUserId = 'cmejzw1ea0000l104f48mvrkb'; // gotoalberto (Farcaster)
  const gmailUserId = 'cmem04y350000kv04urit7pga'; // albertogomeztoribio@gmail.com
  
  console.log('Transfiriendo drops de Instagram del usuario Farcaster al usuario Gmail...');
  
  // Transferir los drops de Instagram
  const result = await prisma.drop.updateMany({
    where: {
      userId: farcasterUserId,
      platform: 'instagram'
    },
    data: {
      userId: gmailUserId
    }
  });
  
  console.log(`\nTransferidos ${result.count} drops de Instagram`);
  
  // Verificar los drops de ambos usuarios
  const gmailUser = await prisma.user.findUnique({
    where: { id: gmailUserId },
    include: {
      drops: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
  
  const farcasterUser = await prisma.user.findUnique({
    where: { id: farcasterUserId },
    include: {
      drops: true
    }
  });
  
  console.log(`\nUsuario Gmail (${gmailUser?.email}) ahora tiene ${gmailUser?.drops.length} drops:`);
  gmailUser?.drops.forEach((drop, index) => {
    console.log(`  ${index + 1}. Platform: ${drop.platform}, Created: ${drop.createdAt}`);
  });
  
  console.log(`\nUsuario Farcaster (${farcasterUser?.username}) ahora tiene ${farcasterUser?.drops.length} drops:`);
  farcasterUser?.drops.forEach((drop, index) => {
    console.log(`  ${index + 1}. Platform: ${drop.platform}, Created: ${drop.createdAt}`);
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