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

    const where: Record<string, any> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { drop: { lumaEventUrl: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const collectors = await prisma.lumaDelivery.findMany({
      where,
      include: {
        drop: {
          select: {
            poapEventId: true,
            lumaEventUrl: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    // Get guest info for each collector
    const collectorsWithGuests = await Promise.all(
      collectors.map(async (collector) => {
        const guest = await prisma.lumaGuest.findUnique({
          where: {
            dropId_guestId: {
              dropId: collector.dropId,
              guestId: collector.guestId,
            },
          },
          select: {
            ethAddress: true,
          },
        });

        return { ...collector, guest };
      })
    );

    return NextResponse.json({ collectors: collectorsWithGuests });
  } catch (error) {
    console.error('Error fetching Luma collectors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}