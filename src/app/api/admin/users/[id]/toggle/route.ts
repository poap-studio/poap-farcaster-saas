import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '~/lib/admin-auth';
import { prisma } from '~/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isActive } = await request.json();

    const user = await prisma.authorizedUser.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}