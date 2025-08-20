import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDrop() {
  try {
    // Verificar el drop específico
    const drop = await prisma.drop.findUnique({
      where: { slug: 'cmejzy6ha0005l104j5zk4bwm' },
      include: { user: true }
    });

    console.log('Drop data:', JSON.stringify(drop, null, 2));

    // Verificar todos los drops
    const allDrops = await prisma.drop.findMany({
      include: { user: true }
    });

    console.log('\nAll drops:', allDrops.length);
    allDrops.forEach(d => {
      console.log(`- ${d.slug}: colors(${d.backgroundColor}, ${d.buttonColor}), logo: ${d.logoUrl || 'none'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrop();