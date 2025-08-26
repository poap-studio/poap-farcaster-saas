import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
    }
  }
});

async function main() {
  console.log('Buscando usuario con email albertogomeztoribio@gmail.com...\n');
  
  // Buscar por email
  const userByEmail = await prisma.user.findFirst({
    where: {
      email: 'albertogomeztoribio@gmail.com'
    },
    include: {
      drops: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (userByEmail) {
    console.log('Usuario encontrado por email:');
    console.log(`ID: ${userByEmail.id}`);
    console.log(`Username: ${userByEmail.username}`);
    console.log(`Email: ${userByEmail.email}`);
    console.log(`Provider: ${userByEmail.provider}`);
    console.log(`Google ID: ${userByEmail.googleId}`);
    console.log(`Número de drops: ${userByEmail.drops.length}`);
    
    if (userByEmail.drops.length > 0) {
      console.log('\nDrops:');
      userByEmail.drops.forEach((drop, index) => {
        console.log(`  ${index + 1}. Platform: ${drop.platform}, ID: ${drop.id}, Created: ${drop.createdAt}`);
      });
    }
  }

  // Buscar todos los usuarios para debug
  console.log('\n\nTodos los usuarios con provider google:');
  const googleUsers = await prisma.user.findMany({
    where: {
      provider: 'google'
    },
    include: {
      drops: true
    }
  });

  googleUsers.forEach(user => {
    console.log(`\nUsername: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Drops: ${user.drops.length}`);
  });

  // Buscar drops huérfanos
  console.log('\n\nÚltimos 5 drops de Instagram:');
  const recentDrops = await prisma.drop.findMany({
    where: {
      platform: 'instagram'
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  recentDrops.forEach((drop, index) => {
    console.log(`\n${index + 1}. Drop ID: ${drop.id}`);
    console.log(`   User ID: ${drop.userId}`);
    console.log(`   Username: ${drop.user.username}`);
    console.log(`   User Email: ${drop.user.email}`);
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