import { NextResponse } from 'next/server';
import { getSession } from '~/lib/session';
import { prisma } from '~/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    // Check if there's a connected Instagram account
    // For now, we'll check for the most recent account
    // In a production app, you'd want to associate this with the user session
    const account = await prisma.instagramAccount.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        instagramId: true,
        username: true
      }
    });

    if (!account) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      account: {
        id: account.id, // Database ID, not Instagram ID
        instagramId: account.instagramId,
        username: account.username
      }
    });

  } catch (error) {
    console.error('[Instagram Status] Error:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}