import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDropColors() {
  try {
    // Verificar el drop específico
    const drop = await prisma.drop.findUnique({
      where: { slug: 'cmejzy6ha0005l104j5zk4bwm' },
    });

    if (!drop) {
      console.log('Drop not found');
      return;
    }

    console.log('Drop colors in database:');
    console.log('- backgroundColor:', drop.backgroundColor);
    console.log('- buttonColor:', drop.buttonColor);
    console.log('- logoUrl:', drop.logoUrl);

    // Hacer fetch al API para verificar que devuelve los colores correctos
    const apiUrl = process.env.NEXT_PUBLIC_URL || 'https://poap-farcaster-saas.vercel.app';
    const response = await fetch(`${apiUrl}/api/drops/slug/${drop.slug}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\nDrop colors from API:');
      console.log('- backgroundColor:', data.drop.backgroundColor);
      console.log('- buttonColor:', data.drop.buttonColor);
      console.log('- logoUrl:', data.drop.logoUrl);
    } else {
      console.log('Error fetching from API:', response.status);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDropColors();