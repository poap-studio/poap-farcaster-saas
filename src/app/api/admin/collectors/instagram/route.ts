import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';
import { checkAdminAccess } from '~/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const where: Record<string, any> = {
      deliveryStatus: 'delivered',
    };
    
    if (search) {
      where.OR = [
        { recipientValue: { contains: search, mode: 'insensitive' } },
        { message: { senderUsername: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const collectors = await prisma.instagramDelivery.findMany({
      where,
      include: {
        drop: {
          select: {
            poapEventId: true,
            instagramStoryUrl: true,
          },
        },
        message: {
          select: {
            senderUsername: true,
            text: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ collectors });
  } catch (error) {
    console.error('Error fetching Instagram collectors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}