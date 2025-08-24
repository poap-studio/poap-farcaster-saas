import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

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

async function claimPoapForEmail(email: string, eventId: string, secretCode: string, sendEmail: boolean) {
  try {
    const response = await fetch('https://api.poap.tech/actions/claim-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.POAP_API_KEY}`,
      },
      body: JSON.stringify({
        address: email,
        qr_hash: secretCode,
        secret: secretCode,
        sendEmail: sendEmail
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[POAP API] Error claiming for email:', result);
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('[POAP API] Error claiming:', error);
    return null;
  }
}

async function mintPoapLink(eventId: string, secretCode: string) {
  try {
    // First, get a mint link from POAP
    const response = await fetch(`https://api.poap.tech/event/${eventId}/qr-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.POAP_API_KEY}`,
        'X-API-Key': process.env.POAP_API_KEY!,
      },
      body: JSON.stringify({
        secret_code: secretCode,
        requested_codes: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[POAP API] Error getting mint link:', error);
      return null;
    }

    const result = await response.json();
    if (result.qr_codes && result.qr_codes.length > 0) {
      return result.qr_codes[0].claimed_page_url;
    }

    return null;
  } catch (error) {
    console.error('[POAP API] Error getting mint link:', error);
    return null;
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
                recipientId: message.recipient?.id || '',
                timestamp: BigInt(message.timestamp || Date.now()),
                storyId: message.message.reply_to?.story?.id || null,
                storyUrl: message.message.reply_to?.story?.url || null
              };

              console.log('[Instagram Webhook] Processing message:', messageData);

              try {
                // Store in database
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

                    // Check if already claimed
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

                    // Deliver POAP based on type
                    let poapLink = null;
                    let deliveryStatus = 'failed';
                    let errorMessage = null;

                    try {
                      if (recipientInfo.type === 'email') {
                        // For email, claim directly
                        const claimResult = await claimPoapForEmail(
                          recipientInfo.value,
                          drop.poapEventId,
                          drop.poapSecretCode,
                          drop.sendPoapEmail
                        );
                        
                        if (claimResult) {
                          deliveryStatus = 'delivered';
                          poapLink = recipientInfo.value; // Store email as reference
                        } else {
                          errorMessage = 'Failed to claim POAP';
                        }
                      } else {
                        // For ENS and address, get mint link
                        const mintLink = await mintPoapLink(drop.poapEventId, drop.poapSecretCode);
                        
                        if (mintLink) {
                          poapLink = mintLink;
                          deliveryStatus = 'delivered';
                        } else {
                          errorMessage = 'Failed to generate mint link';
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