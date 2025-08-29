import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.email?.endsWith('@poap.fr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const where: Record<string, any> = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const collectors = await prisma.claim.findMany({
      where,
      include: {
        drop: {
          select: {
            poapEventId: true,
          },
        },
      },
      orderBy: { claimedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ collectors });
  } catch (error) {
    console.error('Error fetching Farcaster collectors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}