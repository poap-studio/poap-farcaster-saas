import { NextResponse } from 'next/server';
import { getSession } from '~/lib/session';
import { prisma } from '~/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the most recent Instagram account
    const account = await prisma.instagramAccount.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!account) {
      return NextResponse.json({ error: 'No Instagram account connected' }, { status: 400 });
    }

    // Get user media from Instagram Basic Display API
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,timestamp,permalink&access_token=${account.accessToken}`
    );
    
    if (!mediaResponse.ok) {
      const error = await mediaResponse.json();
      console.error('[Instagram Stories] Error getting media:', error);
      return NextResponse.json({ error: 'Failed to get Instagram media' }, { status: 400 });
    }

    const mediaData = await mediaResponse.json();

    // Filter media to get only recent posts (last 7 days as stories)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMedia = (mediaData.data || []).filter((media: { timestamp: string; media_type: string }) => {
      const mediaDate = new Date(media.timestamp);
      // Only include images and videos
      return mediaDate > sevenDaysAgo && (media.media_type === 'IMAGE' || media.media_type === 'VIDEO');
    });

    return NextResponse.json({
      stories: recentMedia
    });

  } catch (error) {
    console.error('[Instagram Stories] Error:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}