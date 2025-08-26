import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';
import { getPOAPAuthManager } from '~/lib/poap-auth';

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

  // ENS regex (ending with .eth)
  const ensRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]*\.eth\b/;
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

async function sendInstagramMessage(accessToken: string, recipientId: string, messageText: string) {
  try {
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
          secret: qrSecret, // Use the secret obtained from the QR hash
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hubMode = searchParams.get('hub.mode');
  const hubVerifyToken = searchParams.get('hub.verify_token');
  const hubChallenge = searchParams.get('hub.challenge');

  console.log('[Instagram Webhook] Verification request:', {
    mode: hubMode,
    verifyToken: hubVerifyToken,
    challenge: hubChallenge
  });

  // Return the challenge for webhook verification
  if (hubMode === 'subscribe' && hubChallenge) {
    return new Response(hubChallenge, { status: 200 });
  }

  return NextResponse.json({ message: 'Webhook verification endpoint' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Instagram Webhook] Received webhook:', JSON.stringify(body, null, 2));

    // Validate Instagram webhook structure
    if (body.object !== 'instagram') {
      console.error('[Instagram Webhook] Invalid object type:', body.object);
      return NextResponse.json({ error: 'Invalid webhook object' }, { status: 400 });
    }

    // Process each entry
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        // Process messaging events
        if (entry.messaging && Array.isArray(entry.messaging)) {
          for (const message of entry.messaging) {
            if (message.message && message.message.text) {
              // Extract message data
              const messageData = {
                messageId: message.message.mid || '',
                text: message.message.text,
                senderId: message.sender?.id || '',
                senderUsername: message.sender?.username || null, // Try to get username if available
                recipientId: message.recipient?.id || '',
                timestamp: BigInt(message.timestamp || Date.now()),
                storyId: message.message.reply_to?.story?.id || null,
                storyUrl: message.message.reply_to?.story?.url || null
              };

              console.log('[Instagram Webhook] Processing message:', messageData);

              try {
                // Store in database first
                const savedMessage = await prisma.instagramMessage.create({
                  data: messageData
                });
                
                console.log('[Instagram Webhook] Message stored successfully');
                
                // Check if this story belongs to a drop
                if (messageData.storyId) {
                  const drop = await prisma.drop.findFirst({
                    where: {
                      instagramStoryId: messageData.storyId,
                      isActive: true,
                      platform: 'instagram'
                    },
                    include: {
                      instagramMessages: true,
                      instagramAccount: true
                    }
                  });

                  if (drop && drop.instagramMessages && drop.instagramAccount) {
                    console.log('[Instagram Webhook] Found drop for story:', drop.id);
                    
                    // Try to get username if not provided
                    if (!messageData.senderUsername && messageData.senderId) {
                      const username = await getInstagramUsername(drop.instagramAccount.accessToken, messageData.senderId);
                      if (username) {
                        // Update the message with the username
                        await prisma.instagramMessage.update({
                          where: { id: savedMessage.id },
                          data: { senderUsername: username }
                        });
                        console.log('[Instagram Webhook] Updated username:', username);
                      }
                    }
                    
                    // Extract recipient info from message
                    const recipientInfo = extractRecipientInfo(messageData.text);
                    
                    if (!recipientInfo.type || !recipientInfo.value) {
                      // Send invalid format message
                      await sendInstagramMessage(
                        drop.instagramAccount.accessToken,
                        messageData.senderId,
                        drop.instagramMessages.invalidFormatMessage
                      );
                      continue;
                    }

                    // Check if format is accepted
                    if (!drop.acceptedFormats.includes(recipientInfo.type)) {
                      await sendInstagramMessage(
                        drop.instagramAccount.accessToken,
                        messageData.senderId,
                        drop.instagramMessages.invalidFormatMessage
                      );
                      continue;
                    }

                    // Check if already claimed by this recipient info
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
                      // Send already claimed message
                      await sendInstagramMessage(
                        drop.instagramAccount.accessToken,
                        messageData.senderId,
                        drop.instagramMessages.alreadyClaimedMessage
                      );
                      continue;
                    }

                    // Check if this Instagram user already claimed a POAP for this story
                    const existingUserDelivery = await prisma.instagramDelivery.findFirst({
                      where: {
                        dropId: drop.id,
                        deliveryStatus: 'delivered',
                        message: {
                          senderId: messageData.senderId
                        }
                      }
                    });

                    if (existingUserDelivery) {
                      // This Instagram user already claimed a POAP for this story
                      await sendInstagramMessage(
                        drop.instagramAccount.accessToken,
                        messageData.senderId,
                        drop.instagramMessages.alreadyClaimedMessage
                      );
                      continue;
                    }

                    // Create delivery record
                    const delivery = await prisma.instagramDelivery.create({
                      data: {
                        dropId: drop.id,
                        messageId: savedMessage.messageId,
                        recipientType: recipientInfo.type,
                        recipientValue: recipientInfo.value,
                        deliveryStatus: 'pending'
                      }
                    });

                    // Deliver POAP using the 3-step process
                    let poapLink = null;
                    let deliveryStatus = 'failed';
                    let errorMessage = null;

                    try {
                      // At this point, we've already validated that recipientInfo has valid values
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
                        // Special handling for "No POAPs available"
                        if (deliveryResult.error === 'No POAPs available') {
                          console.log('[Instagram Webhook] No POAPs available for drop:', drop.id);
                        }
                      }
                    } catch (error) {
                      console.error('[Instagram Webhook] Error delivering POAP:', error);
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

                    // Update message as processed
                    await prisma.instagramMessage.update({
                      where: { id: savedMessage.id },
                      data: {
                        processed: true,
                        processedAt: new Date(),
                        dropId: drop.id
                      }
                    });

                    // Send response message
                    if (deliveryStatus === 'delivered') {
                      let successMessage = drop.instagramMessages.successMessage;
                      successMessage = successMessage.replace('{{recipient}}', recipientInfo.value);
                      
                      if (recipientInfo.type !== 'email' && poapLink) {
                        successMessage += `\n\nClaim your POAP here: ${poapLink}`;
                      }
                      
                      await sendInstagramMessage(
                        drop.instagramAccount.accessToken,
                        messageData.senderId,
                        successMessage
                      );
                    } else {
                      // Send error message
                      await sendInstagramMessage(
                        drop.instagramAccount.accessToken,
                        messageData.senderId,
                        `Sorry, there was an error delivering your POAP. Please try again later.`
                      );
                    }
                  } else {
                    console.log('[Instagram Webhook] No active drop found for story:', messageData.storyId);
                  }
                }
                
              } catch (dbError) {
                // Check if it's a duplicate message
                if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                  console.log('[Instagram Webhook] Message already exists, skipping');
                } else {
                  console.error('[Instagram Webhook] Database error:', dbError);
                }
              }
            }
          }
        }
      }
    }

    // Always return 200 to prevent Instagram from retrying
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Instagram Webhook] Error processing webhook:', error);
    
    // Still return 200 to prevent retries
    return NextResponse.json({ 
      success: false, 
      error: 'Internal error', 
      timestamp: new Date().toISOString()
    });
  }
}

// Handle other HTTP methods
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}