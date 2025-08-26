import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
    }
  }
});

async function main() {
  console.log('Buscando usuarios con username gotoalberto...');
  
  // Buscar todos los usuarios con username gotoalberto
  const users = await prisma.user.findMany({
    where: {
      username: 'gotoalberto'
    },
    include: {
      drops: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  console.log(`\nEncontrados ${users.length} usuarios con username 'gotoalberto':\n`);
  
  for (const user of users) {
    console.log(`Usuario ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Provider: ${user.provider}`);
    console.log(`Creado: ${user.createdAt}`);
    console.log(`Número de drops: ${user.drops.length}`);
    
    if (user.drops.length > 0) {
      console.log('\nÚltimos drops:');
      user.drops.slice(0, 5).forEach((drop, index) => {
        console.log(`  ${index + 1}. Platform: ${drop.platform}, ID: ${drop.id}, Created: ${drop.createdAt}`);
      });
    }
    console.log('\n---');
  }

  // Buscar drops de Instagram creados recientemente
  console.log('\nBuscando drops de Instagram recientes...');
  const recentInstagramDrops = await prisma.drop.findMany({
    where: {
      platform: 'instagram',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
      }
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  console.log(`\nEncontrados ${recentInstagramDrops.length} drops de Instagram en las últimas 24 horas:`);
  recentInstagramDrops.forEach((drop, index) => {
    console.log(`${index + 1}. Drop ID: ${drop.id}`);
    console.log(`   Usuario: ${drop.user.username} (ID: ${drop.userId})`);
    console.log(`   Creado: ${drop.createdAt}`);
    console.log(`   Story ID: ${drop.instagramStoryId || 'N/A'}`);
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