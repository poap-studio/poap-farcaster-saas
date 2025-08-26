const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function getInstagramUsername(accessToken, userId) {
  try {
    const response = await fetch(`https://graph.instagram.com/${userId}?fields=username&access_token=${accessToken}`);
    
    if (!response.ok) {
      console.error(`[Instagram API] Error getting username for ${userId}:`, await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.username || null;
  } catch (error) {
    console.error(`[Instagram API] Error getting username for ${userId}:`, error);
    return null;
  }
}

async function updateInstagramUsernames() {
  try {
    console.log('Starting Instagram username update...');
    
    // Get all Instagram messages without username
    const messagesWithoutUsername = await prisma.instagramMessage.findMany({
      where: {
        senderUsername: null,
        senderId: { not: '' }
      },
      select: {
        id: true,
        senderId: true,
        storyId: true
      }
    });
    
    console.log(`Found ${messagesWithoutUsername.length} messages without username`);
    
    if (messagesWithoutUsername.length === 0) {
      console.log('No messages to update');
      return;
    }
    
    // Group messages by senderId to minimize API calls
    const senderIds = [...new Set(messagesWithoutUsername.map(m => m.senderId))];
    console.log(`Unique senders to process: ${senderIds.length}`);
    
    // Get the most recent Instagram account for access token
    const instagramAccount = await prisma.instagramAccount.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!instagramAccount) {
      console.error('No Instagram account found with access token');
      return;
    }
    
    console.log('Using Instagram account:', instagramAccount.username);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    // Process each unique sender
    for (const senderId of senderIds) {
      console.log(`\nProcessing sender: ${senderId}`);
      
      try {
        // Get username from Instagram API
        const username = await getInstagramUsername(instagramAccount.accessToken, senderId);
        
        if (username) {
          // Update all messages from this sender
          const result = await prisma.instagramMessage.updateMany({
            where: {
              senderId: senderId,
              senderUsername: null
            },
            data: {
              senderUsername: username
            }
          });
          
          console.log(`✓ Updated ${result.count} messages with username: @${username}`);
          updatedCount += result.count;
        } else {
          console.log(`✗ Failed to get username for sender: ${senderId}`);
          failedCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing sender ${senderId}:`, error);
        failedCount++;
      }
    }
    
    console.log('\n=== Update Summary ===');
    console.log(`Total messages updated: ${updatedCount}`);
    console.log(`Failed senders: ${failedCount}`);
    console.log(`Success rate: ${Math.round((senderIds.length - failedCount) / senderIds.length * 100)}%`);
    
  } catch (error) {
    console.error('Error updating Instagram usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateInstagramUsernames()
  .then(() => {
    console.log('\nUsername update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });