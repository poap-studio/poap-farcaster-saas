const { PrismaClient } = require('@prisma/client');

async function verifyInstagramData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:POAPFarcaster2024!@poap-farcaster-db.cuayvp8dpvrg.us-east-1.rds.amazonaws.com:5432/postgres"
      }
    }
  });

  try {
    console.log('=== Verificando datos de Instagram en la base de datos ===\n');
    
    // Contar total de mensajes
    const totalMessages = await prisma.instagramMessage.count();
    console.log(`Total de mensajes en BD: ${totalMessages}`);
    
    // Obtener el mensaje "Hin"
    const hinMessage = await prisma.instagramMessage.findFirst({
      where: { text: 'Hin' }
    });
    
    if (hinMessage) {
      console.log('\n=== Mensaje "Hin" en la base de datos ===');
      console.log('ID en BD:', hinMessage.id);
      console.log('Message ID:', hinMessage.messageId);
      console.log('Texto:', hinMessage.text);
      console.log('Sender ID:', hinMessage.senderId);
      console.log('Recipient ID:', hinMessage.recipientId);
      console.log('Timestamp:', hinMessage.timestamp.toString());
      console.log('Story ID:', hinMessage.storyId);
      console.log('Story URL:', hinMessage.storyUrl ? hinMessage.storyUrl.substring(0, 100) + '...' : null);
      console.log('Received At:', hinMessage.receivedAt);
      console.log('Created At:', hinMessage.createdAt);
    }
    
    // Obtener todos los mensajes del sender
    const allMessages = await prisma.instagramMessage.findMany({
      where: { senderId: '555790987187661' },
      orderBy: { timestamp: 'desc' }
    });
    
    console.log('\n=== Todos los mensajes del sender 555790987187661 ===');
    allMessages.forEach((msg, index) => {
      console.log(`\n${index + 1}. Texto: "${msg.text}"`);
      console.log(`   Timestamp: ${msg.timestamp.toString()}`);
      console.log(`   Story ID: ${msg.storyId || 'N/A'}`);
      console.log(`   Guardado: ${msg.createdAt}`);
    });
    
    // Verificar estructura de la tabla
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'InstagramMessage' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n=== Estructura de la tabla InstagramMessage ===');
    tableInfo.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error verificando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyInstagramData();