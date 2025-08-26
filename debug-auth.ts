import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
    }
  }
});

async function main() {
  console.log('=== VERIFICANDO TODOS LOS USUARIOS ===\n');
  
  // Buscar TODOS los usuarios que contengan "alberto"
  const allAlbertoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: 'alberto' } },
        { email: { contains: 'alberto' } }
      ]
    },
    include: {
      drops: {
        select: {
          id: true,
          platform: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Encontrados ${allAlbertoUsers.length} usuarios relacionados con "alberto":\n`);
  
  allAlbertoUsers.forEach((user, index) => {
    console.log(`${index + 1}. Usuario:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Provider: ${user.provider}`);
    console.log(`   Google ID: ${user.googleId || 'N/A'}`);
    console.log(`   Creado: ${user.createdAt}`);
    console.log(`   Número de drops: ${user.drops.length}`);
    
    if (user.drops.length > 0) {
      console.log('   Drops:');
      user.drops.forEach((drop, idx) => {
        console.log(`     ${idx + 1}. ${drop.platform} - ${drop.createdAt}`);
      });
    }
    console.log('');
  });

  // Ver sesiones activas
  console.log('\n=== VERIFICANDO DROPS RECIENTES ===\n');
  
  const recentDrops = await prisma.drop.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });

  console.log('Últimos 10 drops en la base de datos:');
  recentDrops.forEach((drop, index) => {
    console.log(`\n${index + 1}. Drop:`);
    console.log(`   ID: ${drop.id}`);
    console.log(`   Platform: ${drop.platform}`);
    console.log(`   User ID: ${drop.userId}`);
    console.log(`   Username: ${drop.user.username}`);
    console.log(`   User Email: ${drop.user.email || 'N/A'}`);
    console.log(`   Created: ${drop.createdAt}`);
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