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

    let allStories: any[] = [];

    // 1. Get active stories (last 24 hours)
    try {
      const storiesResponse = await fetch(
        `https://graph.instagram.com/${account.instagramId}/stories?fields=id,media_type,media_url,timestamp,permalink&access_token=${account.accessToken}`
      );
      
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        const activeStories = (storiesData.data || []).map((story: any) => ({
          ...story,
          isHighlight: false
        }));
        allStories = [...allStories, ...activeStories];
        console.log('[Instagram Stories] Found', activeStories.length, 'active stories');
      }
    } catch (error) {
      console.error('[Instagram Stories] Error getting active stories:', error);
    }

    // 2. Get highlights
    try {
      const highlightsResponse = await fetch(
        `https://graph.instagram.com/${account.instagramId}/available_story_highlights?fields=id,title,cover_media{id,media_type,media_url,timestamp}&access_token=${account.accessToken}`
      );
      
      if (highlightsResponse.ok) {
        const highlightsData = await highlightsResponse.json();
        console.log('[Instagram Stories] Found', highlightsData.data?.length || 0, 'highlights');
        
        // For each highlight, get its media
        for (const highlight of (highlightsData.data || [])) {
          try {
            const highlightMediaResponse = await fetch(
              `https://graph.instagram.com/${highlight.id}?fields=id,title,media{id,media_type,media_url,timestamp,permalink}&access_token=${account.accessToken}`
            );
            
            if (highlightMediaResponse.ok) {
              const highlightMediaData = await highlightMediaResponse.json();
              const highlightStories = (highlightMediaData.media?.data || []).map((media: any) => ({
                ...media,
                isHighlight: true,
                highlightTitle: highlight.title || 'Highlight'
              }));
              allStories = [...allStories, ...highlightStories];
              console.log('[Instagram Stories] Added', highlightStories.length, 'stories from highlight:', highlight.title);
            }
          } catch (error) {
            console.error('[Instagram Stories] Error getting highlight media:', error);
          }
        }
      }
    } catch (error) {
      console.error('[Instagram Stories] Error getting highlights:', error);
    }

    // If no stories found, try media endpoint as fallback
    if (allStories.length === 0) {
      console.log('[Instagram Stories] No stories or highlights found, trying media endpoint');
      
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
      
      allStories = recentMedia.map((media: any) => ({
        ...media,
        isHighlight: false
      }));
    }

    // Sort by timestamp (newest first) and add source info
    allStories.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      stories: allStories
    });

  } catch (error) {
    console.error('[Instagram Stories] Error:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}