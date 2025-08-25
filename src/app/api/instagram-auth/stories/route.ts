import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '~/lib/session';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Get the specific Instagram account
    const account = await prisma.instagramAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'No Instagram account connected' }, { status: 400 });
    }

    // For Instagram Business accounts, we need to use the stories endpoint
    const storiesResponse = await fetch(
      `https://graph.instagram.com/${account.instagramId}/stories?fields=id,media_type,media_url,timestamp,permalink&access_token=${account.accessToken}`
    );
    
    if (!storiesResponse.ok) {
      const error = await storiesResponse.json();
      console.error('[Instagram Stories] Error getting stories:', error);
      
      // If stories endpoint fails, try media endpoint as fallback
      const mediaResponse = await fetch(
        `https://graph.instagram.com/me/media?fields=id,media_type,media_url,timestamp,permalink&access_token=${account.accessToken}`
      );
      
      if (!mediaResponse.ok) {
        const mediaError = await mediaResponse.json();
        console.error('[Instagram Stories] Error getting media:', mediaError);
        return NextResponse.json({ error: 'Failed to get Instagram content' }, { status: 400 });
      }
      
      const mediaData = await mediaResponse.json();
      // Return recent media as fallback
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentMedia = (mediaData.data || []).filter((media: { timestamp: string; media_type: string }) => {
        const mediaDate = new Date(media.timestamp);
        return mediaDate > sevenDaysAgo && (media.media_type === 'IMAGE' || media.media_type === 'VIDEO');
      });
      
      return NextResponse.json({
        stories: recentMedia
      });
    }

    const storiesData = await storiesResponse.json();

    // Instagram stories are already filtered to last 24 hours by the API
    const stories = storiesData.data || [];

    return NextResponse.json({
      stories: stories
    });

  } catch (error) {
    console.error('[Instagram Stories] Error:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}