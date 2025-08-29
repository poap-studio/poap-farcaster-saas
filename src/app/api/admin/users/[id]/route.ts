import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '~/lib/admin-auth';
import { getSession } from '~/lib/session';
import { prisma } from '~/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Don't allow deleting self
    const session = await getSession();
    const adminUser = await prisma.authorizedUser.findUnique({
      where: { email: session?.email },
    });

    if (adminUser?.id === id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await prisma.authorizedUser.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}