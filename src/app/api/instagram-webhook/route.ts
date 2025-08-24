import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

const INSTAGRAM_ACCESS_TOKEN = 'IGAAZAob8miVV1BZAFBja2RQdVJxRXFpRUpmdG55bFFmdFhJWnpMNEFzakx1ZA1Q3UThvRGpjRXVIRnFsVXBmbldNYi1KNDdQaUZAELVZAPLXhIT0VULWJyRFdKWm5VSGhIU1JnYzBPTWtBV0FabU54ODNWcThB';

async function sendInstagramMessage(recipientId: string, messageText: string) {
  try {
    const response = await fetch(`https://graph.instagram.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
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
                await prisma.instagramMessage.create({
                  data: messageData
                });
                
                console.log('[Instagram Webhook] Message stored successfully');
                
                // Send automatic reply "hola"
                console.log('[Instagram Webhook] Sending automatic reply to sender:', message.sender?.id);
                const replySent = await sendInstagramMessage(
                  message.sender?.id || '', 
                  'hola'
                );
                
                if (replySent) {
                  console.log('[Instagram Webhook] Auto-reply sent successfully');
                } else {
                  console.log('[Instagram Webhook] Failed to send auto-reply');
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