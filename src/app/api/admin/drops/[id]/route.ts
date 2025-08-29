import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '~/lib/admin-auth';
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

    await prisma.drop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting drop:', error);
    return NextResponse.json({ error: 'Failed to delete drop' }, { status: 500 });
  }
}