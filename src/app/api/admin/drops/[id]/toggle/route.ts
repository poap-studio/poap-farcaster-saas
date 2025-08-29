import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '~/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.email?.endsWith('@poap.fr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isActive } = await request.json();

    const drop = await prisma.drop.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ drop });
  } catch (error) {
    console.error('Error toggling drop status:', error);
    return NextResponse.json({ error: 'Failed to update drop' }, { status: 500 });
  }
}