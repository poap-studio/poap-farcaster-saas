import { prisma } from '~/lib/prisma';
import { emitDropUpdate } from '~/lib/events';
import { getPOAPAuthManager } from '~/lib/poap-auth';
import { checkPOAPOwnership } from '~/lib/poap-duplicate-check';
import type { Drop, InstagramAccount, InstagramDropMessages, InstagramMessage } from '@prisma/client';

// Helper function to extract email, ENS, or Ethereum address from text
function extractRecipientInfo(text: string): { type: 'email' | 'ens' | 'address' | null; value: string | null } {
  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    return { type: 'email', value: emailMatch[0].toLowerCase() };
  }

  // Ethereum address regex (0x followed by 40 hex characters)
  const addressRegex = /\b0x[a-fA-F0-9]{40}\b/;
  const addressMatch = text.match(addressRegex);
  if (addressMatch) {
    return { type: 'address', value: addressMatch[0].toLowerCase() };
  }

  // ENS regex (ending with .eth, including subdomains)
  const ensRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.eth\b/;
  const ensMatch = text.match(ensRegex);
  if (ensMatch) {
    return { type: 'ens', value: ensMatch[0].toLowerCase() };
  }

  return { type: null, value: null };
}

async function getInstagramUsername(accessToken: string, userId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://graph.instagram.com/${userId}?fields=username&access_token=${accessToken}`);
    
    if (!response.ok) {
      console.error('[Instagram API] Error getting username:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.username || null;
  } catch (error) {
    console.error('[Instagram API] Error getting username:', error);
    return null;
  }
}

async function sendInstagramMessage(accessToken: string, recipientId: string, messageText: string): Promise<boolean> {
  try {
    console.log('[Instagram API] Attempting to send message:', {
      recipientId,
      messageLength: messageText.length,
      messagePreview: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
      hasRecipientPlaceholder: messageText.includes('{{recipient}}')
    });
    
    // Note: Instagram Basic Display API doesn't support messaging
    // This requires Instagram Messaging API which needs business verification
    // For now, we'll attempt to use the Graph API endpoint
    const response = await fetch(`https://graph.instagram.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        },
        message: {
          text: messageText
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Instagram API] Error sending message:', result);
      return false;
    }
    
    console.log('[Instagram API] Message sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[Instagram API] Error sending message:', error);
    return false;
  }
}

// Get available QR hashes for an event
async function getAvailableQRHashes(eventId: string, secretCode: string): Promise<string[]> {
  try {
    const authManager = getPOAPAuthManager();
    const response = await authManager.makeAuthenticatedRequest(
      `https://api.poap.tech/event/${eventId}/qr-codes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.POAP_API_KEY || '',
        },
        body: JSON.stringify({
          secret_code: secretCode
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[POAP API] Error getting QR hashes:', error);
      return [];
    }

    const result = await response.json();
    console.log('[POAP API] Available QR codes:', result.length);
    
    // Filter out only unused QR codes
    const availableHashes = result
      .filter((qr: { claimed: boolean }) => !qr.claimed)
      .map((qr: { qr_hash: string }) => qr.qr_hash);
    
    return availableHashes;
  } catch (error) {
    console.error('[POAP API] Error getting QR hashes:', error);
    return [];
  }
}

// Get secret for a specific QR hash
async function getQRSecret(qrHash: string): Promise<string | null> {
  try {
    const authManager = getPOAPAuthManager();
    const response = await authManager.makeAuthenticatedRequest(
      `https://api.poap.tech/actions/claim-qr?qr_hash=${qrHash}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.POAP_API_KEY || '',
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[POAP API] Error getting QR secret:', error);
      return null;
    }

    const result = await response.json();
    return result.secret;
  } catch (error) {
    console.error('[POAP API] Error getting QR secret:', error);
    return null;
  }
}

// Claim POAP with the obtained secret
async function claimPOAP(qrHash: string, qrSecret: string, recipientInfo: { type: 'email' | 'ens' | 'address'; value: string }, sendEmail: boolean): Promise<{ claim_url?: string; qr_hash?: string } | null> {
  try {
    const authManager = getPOAPAuthManager();
    const response = await authManager.makeAuthenticatedRequest(
      `https://api.poap.tech/actions/claim-qr`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.POAP_API_KEY || '',
        },
        body: JSON.stringify({
          address: recipientInfo.value,
          qr_hash: qrHash,
          secret: qrSecret,
          sendEmail: recipientInfo.type === 'email' ? sendEmail : false
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[POAP API] Error claiming POAP:', error);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[POAP API] Error claiming POAP:', error);
    return null;
  }
}

// Main function to deliver POAP following the 3-step process
async function deliverPOAP(eventId: string, eventSecretCode: string, recipientInfo: { type: 'email' | 'ens' | 'address'; value: string }, sendEmail: boolean): Promise<{ success: boolean; data?: { claim_url?: string; qr_hash?: string }; error?: string }> {
  try {
    // Step 1: Get available QR hashes
    console.log('[POAP Delivery] Step 1: Getting available QR hashes...');
    const availableHashes = await getAvailableQRHashes(eventId, eventSecretCode);
    
    if (availableHashes.length === 0) {
      return { success: false, error: 'No POAPs available' };
    }
    
    // Use the first available QR hash
    const qrHash = availableHashes[0];
    console.log('[POAP Delivery] Using QR hash:', qrHash);
    
    // Step 2: Get the secret for this QR hash
    console.log('[POAP Delivery] Step 2: Getting QR secret...');
    const qrSecret = await getQRSecret(qrHash);
    
    if (!qrSecret) {
      return { success: false, error: 'Failed to get QR secret' };
    }
    
    console.log('[POAP Delivery] Got QR secret');
    
    // Step 3: Claim the POAP with the QR hash and secret
    console.log('[POAP Delivery] Step 3: Claiming POAP...');
    const claimResult = await claimPOAP(qrHash, qrSecret, recipientInfo, sendEmail);
    
    if (!claimResult) {
      return { success: false, error: 'Failed to claim POAP' };
    }
    
    console.log('[POAP Delivery] POAP delivered successfully');
    return { success: true, data: claimResult };
    
  } catch (error) {
    console.error('[POAP Delivery] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface ProcessMessageResult {
  processed: boolean;
  deliveryId?: string;
  error?: string;
}

export async function processInstagramMessage(
  message: InstagramMessage,
  drop: Drop & {
    instagramMessages: InstagramDropMessages | null;
    instagramAccount: InstagramAccount | null;
  }
): Promise<ProcessMessageResult> {
  try {
    if (!drop.instagramMessages || !drop.instagramAccount) {
      return { processed: false, error: 'Drop configuration incomplete' };
    }

    // Update username if not present
    if (!message.senderUsername && message.senderId) {
      const username = await getInstagramUsername(drop.instagramAccount.accessToken, message.senderId);
      if (username) {
        await prisma.instagramMessage.update({
          where: { id: message.id },
          data: { senderUsername: username }
        });
        console.log('[Message Processor] Updated username:', username);
      }
    }

    // Extract recipient info from message
    const recipientInfo = extractRecipientInfo(message.text);
    
    if (!recipientInfo.type || !recipientInfo.value) {
      // Send invalid format message
      console.log('[Message Processor] Invalid format in message');
      const invalidMessage = drop.instagramMessages.invalidFormatMessage;
      // Note: Cannot replace {{recipient}} since we don't have a valid recipient
      await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        invalidMessage
      );
      return { processed: true, error: 'Invalid format' };
    }

    // Check if format is accepted
    if (!drop.acceptedFormats.includes(recipientInfo.type)) {
      console.log('[Message Processor] Format not accepted:', recipientInfo.type);
      let invalidMessage = drop.instagramMessages.invalidFormatMessage;
      invalidMessage = invalidMessage.replace(/\{\{recipient\}\}/g, recipientInfo.value);
      await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        invalidMessage
      );
      return { processed: true, error: 'Format not accepted' };
    }

    // Check if recipient already owns this POAP
    const ownershipCheck = await checkPOAPOwnership(recipientInfo.value, drop.poapEventId);
    if (ownershipCheck.hasPoap) {
      console.log('[Message Processor] Recipient already owns this POAP');
      let alreadyClaimedMessage = drop.instagramMessages.alreadyClaimedMessage;
      alreadyClaimedMessage = alreadyClaimedMessage.replace(/\{\{recipient\}\}/g, recipientInfo.value);
      await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        alreadyClaimedMessage
      );
      return { processed: true, error: 'Already owns POAP' };
    }

    // Check if already claimed by this recipient info in our system
    const existingDelivery = await prisma.instagramDelivery.findUnique({
      where: {
        dropId_recipientValue_recipientType: {
          dropId: drop.id,
          recipientValue: recipientInfo.value,
          recipientType: recipientInfo.type
        }
      }
    });

    if (existingDelivery) {
      console.log('[Message Processor] Already claimed by recipient');
      let alreadyClaimedMessage = drop.instagramMessages.alreadyClaimedMessage;
      alreadyClaimedMessage = alreadyClaimedMessage.replace(/\{\{recipient\}\}/g, recipientInfo.value);
      await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        alreadyClaimedMessage
      );
      return { processed: true, error: 'Already claimed' };
    }

    // Check if this Instagram user already claimed a POAP for this drop
    const existingUserDelivery = await prisma.instagramDelivery.findFirst({
      where: {
        dropId: drop.id,
        deliveryStatus: 'delivered',
        message: {
          senderId: message.senderId
        }
      },
      select: {
        recipientValue: true,
        recipientType: true
      }
    });

    if (existingUserDelivery) {
      console.log('[Message Processor] User already claimed with:', existingUserDelivery.recipientValue);
      let alreadyClaimedMessage = drop.instagramMessages.alreadyClaimedMessage;
      // Replace with the ORIGINAL address/email/ENS that was used
      alreadyClaimedMessage = alreadyClaimedMessage.replace(/\{\{recipient\}\}/g, existingUserDelivery.recipientValue);
      await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        alreadyClaimedMessage
      );
      return { processed: true, error: 'User already claimed' };
    }

    // Create delivery record
    const delivery = await prisma.instagramDelivery.create({
      data: {
        dropId: drop.id,
        messageId: message.messageId,
        recipientType: recipientInfo.type,
        recipientValue: recipientInfo.value,
        deliveryStatus: 'pending'
      }
    });

    // Deliver POAP
    let poapLink = null;
    let deliveryStatus = 'failed';
    let errorMessage = null;

    try {
      const deliveryResult = await deliverPOAP(
        drop.poapEventId,
        drop.poapSecretCode,
        recipientInfo as { type: 'email' | 'ens' | 'address'; value: string },
        drop.sendPoapEmail
      );
      
      if (deliveryResult.success) {
        deliveryStatus = 'delivered';
        // For email recipients, the POAP is sent directly to their email
        // For ENS/address, we need to provide a claim link
        if (recipientInfo.type === 'email') {
          poapLink = recipientInfo.value; // Store email as reference
        } else {
          // Extract claim URL from the result if available
          poapLink = deliveryResult.data?.claim_url || `https://poap.xyz/claim/${deliveryResult.data?.qr_hash}`;
        }
      } else {
        errorMessage = deliveryResult.error || 'Failed to deliver POAP';
      }
    } catch (error) {
      console.error('[Message Processor] Error delivering POAP:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    // Update delivery record
    await prisma.instagramDelivery.update({
      where: { id: delivery.id },
      data: {
        poapLink,
        deliveryStatus,
        errorMessage,
        deliveredAt: deliveryStatus === 'delivered' ? new Date() : null
      }
    });
    
    // Emit real-time update for successful delivery
    if (deliveryStatus === 'delivered') {
      emitDropUpdate(drop.id, 'collector');
      console.log('[Message Processor] Emitted collector update for drop:', drop.id);
    }

    // Send response message
    if (deliveryStatus === 'delivered') {
      let successMessage = drop.instagramMessages.successMessage;
      console.log('[Message Processor] Original success message:', successMessage);
      console.log('[Message Processor] Recipient value to replace:', recipientInfo.value);
      
      // Replace {{recipient}} with the actual recipient value
      successMessage = successMessage.replace(/\{\{recipient\}\}/g, recipientInfo.value);
      console.log('[Message Processor] Success message after replacement:', successMessage);
      
      if (recipientInfo.type !== 'email' && poapLink) {
        successMessage += `\n\nClaim your POAP here: ${poapLink}`;
      }
      
      const messageSent = await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        successMessage
      );
      
      console.log('[Message Processor] Message sent status:', messageSent);
    } else {
      // Send error message
      await sendInstagramMessage(
        drop.instagramAccount.accessToken,
        message.senderId,
        `Sorry, there was an error delivering your POAP. Please try again later.`
      );
    }

    // Update message as processed
    await prisma.instagramMessage.update({
      where: { id: message.id },
      data: {
        processed: true,
        processedAt: new Date(),
        dropId: drop.id
      }
    });

    return { 
      processed: true, 
      deliveryId: delivery.id,
      error: deliveryStatus === 'failed' ? errorMessage || 'Failed to deliver' : undefined
    };
    
  } catch (error) {
    console.error('[Message Processor] Error processing message:', error);
    return { 
      processed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function processHistoricalMessagesForDrop(dropId: string): Promise<{
  processed: number;
  delivered: number;
  failed: number;
}> {
  try {
    // Get the drop with its configuration
    const drop = await prisma.drop.findUnique({
      where: { id: dropId },
      include: {
        instagramMessages: true,
        instagramAccount: true
      }
    });

    if (!drop || drop.platform !== 'instagram' || !drop.instagramStoryId) {
      throw new Error('Invalid drop for processing Instagram messages');
    }

    // Find all unprocessed messages for this story
    const unprocessedMessages = await prisma.instagramMessage.findMany({
      where: {
        storyId: drop.instagramStoryId,
        processed: false
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    console.log(`[Historical Processor] Found ${unprocessedMessages.length} unprocessed messages for story ${drop.instagramStoryId}`);

    let processed = 0;
    let delivered = 0;
    let failed = 0;

    // Process each message
    for (const message of unprocessedMessages) {
      const result = await processInstagramMessage(message, drop);
      
      if (result.processed) {
        processed++;
        if (result.error) {
          failed++;
        } else {
          delivered++;
        }
      }

      // Add a small delay to avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Historical Processor] Processed ${processed} messages: ${delivered} delivered, ${failed} failed`);

    return { processed, delivered, failed };

  } catch (error) {
    console.error('[Historical Processor] Error:', error);
    throw error;
  }
}