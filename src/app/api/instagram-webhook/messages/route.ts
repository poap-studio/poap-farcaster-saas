import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const senderId = searchParams.get('senderId');
    const messageId = searchParams.get('messageId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get specific message by ID
    if (messageId) {
      const message = await prisma.instagramMessage.findUnique({
        where: { messageId }
      });
      
      if (message) {
        return NextResponse.json({ 
          success: true, 
          message: {
            ...message,
            timestamp: message.timestamp.toString()
          } 
        });
      } else {
        return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
      }
    }

    // Get messages by sender
    if (senderId) {
      const messages = await prisma.instagramMessage.findMany({
        where: { senderId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      return NextResponse.json({ 
        success: true, 
        senderId,
        count: messages.length,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toString()
        }))
      });
    }

    // Get recent messages
    const messages = await prisma.instagramMessage.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    
    return NextResponse.json({ 
      success: true, 
      count: messages.length,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toString()
      }))
    });

  } catch (error) {
    console.error('[Instagram Messages API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}