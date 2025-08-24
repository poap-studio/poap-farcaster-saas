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

    // Get Instagram stories
    // Note: Instagram API requires page access token for stories
    // First, we need to get the pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${account.accessToken}`
    );
    
    if (!pagesResponse.ok) {
      const error = await pagesResponse.json();
      console.error('[Instagram Stories] Error getting pages:', error);
      return NextResponse.json({ error: 'Failed to get Instagram pages' }, { status: 400 });
    }

    const pagesData = await pagesResponse.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ stories: [] });
    }

    // Get the first page (Instagram business account)
    const page = pagesData.data[0];
    
    // Get Instagram business account ID
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    
    if (!igAccountResponse.ok) {
      const error = await igAccountResponse.json();
      console.error('[Instagram Stories] Error getting IG account:', error);
      return NextResponse.json({ error: 'Failed to get Instagram business account' }, { status: 400 });
    }

    const igAccountData = await igAccountResponse.json();
    
    if (!igAccountData.instagram_business_account) {
      return NextResponse.json({ error: 'No Instagram business account found' }, { status: 400 });
    }

    const igBusinessId = igAccountData.instagram_business_account.id;

    // Get stories
    const storiesResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessId}/stories?fields=id,media_url,media_type,timestamp,permalink&access_token=${page.access_token}`
    );

    if (!storiesResponse.ok) {
      const error = await storiesResponse.json();
      console.error('[Instagram Stories] Error getting stories:', error);
      
      // If no stories, return empty array
      if (error.error?.code === 100) {
        return NextResponse.json({ stories: [] });
      }
      
      return NextResponse.json({ error: 'Failed to get stories' }, { status: 400 });
    }

    const storiesData = await storiesResponse.json();

    // Filter stories from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeStories = (storiesData.data || []).filter((story: { timestamp: string }) => {
      const storyDate = new Date(story.timestamp);
      return storyDate > twentyFourHoursAgo;
    });

    return NextResponse.json({
      stories: activeStories
    });

  } catch (error) {
    console.error('[Instagram Stories] Error:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}