import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '~/lib/admin-auth';
import { getSession } from '~/lib/session';
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

    // Check if requester is admin
    const session = await getSession();
    const adminUser = await prisma.authorizedUser.findUnique({
      where: { email: session?.email },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { isAdmin } = await request.json();

    const user = await prisma.authorizedUser.update({
      where: { id },
      data: { isAdmin },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}