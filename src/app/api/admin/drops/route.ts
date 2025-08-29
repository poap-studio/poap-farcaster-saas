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
    const platform = searchParams.get('platform');
    const user = searchParams.get('user');

    const where: Record<string, any> = {};
    if (platform) where.platform = platform;
    if (user) {
      where.OR = [
        { user: { email: { contains: user, mode: 'insensitive' } } },
        { user: { username: { contains: user, mode: 'insensitive' } } },
      ];
    }

    const drops = await prisma.drop.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            username: true,
            provider: true,
          },
        },
        _count: {
          select: {
            claims: true,
            lumaDeliveries: true,
            instagramDeliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ drops });
  } catch (error) {
    console.error('Error fetching drops:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}