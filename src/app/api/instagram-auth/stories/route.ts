import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '~/lib/session';
import { prisma } from '~/lib/prisma';

async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('[Image Download] Error downloading image:', error);
    return null;
  }
}

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
    const storiesMap = new Map<string, any>();

    // 1. First, get all stored stories from database
    const storedStories = await prisma.instagramStory.findMany({
      where: {
        accountId: account.id,
        isActive: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Add stored stories to map
    storedStories.forEach(story => {
      storiesMap.set(story.storyId, {
        id: story.storyId,
        media_url: story.imageData || story.mediaUrl,
        media_type: story.mediaType,
        timestamp: story.timestamp.toISOString(),
        permalink: story.permalink,
        isHighlight: story.isHighlight,
        highlightTitle: story.highlightTitle,
        fromDB: true
      });
    });

    // 2. Get active stories (last 24 hours) from Instagram API
    try {
      const storiesResponse = await fetch(
        `https://graph.instagram.com/${account.instagramId}/stories?fields=id,media_type,media_url,timestamp,permalink&access_token=${account.accessToken}`
      );
      
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        const activeStories = storiesData.data || [];
        
        // Process and save new stories
        for (const story of activeStories) {
          // Check if story already exists
          const existingStory = await prisma.instagramStory.findUnique({
            where: { storyId: story.id }
          });

          if (!existingStory) {
            // Download image as base64
            const imageData = await downloadImageAsBase64(story.media_url);
            
            // Save to database
            await prisma.instagramStory.create({
              data: {
                accountId: account.id,
                storyId: story.id,
                mediaUrl: story.media_url,
                mediaType: story.media_type,
                timestamp: new Date(story.timestamp),
                permalink: story.permalink,
                imageData,
                isHighlight: false,
                isActive: true
              }
            });
          }

          // Add to map (this will update if exists)
          storiesMap.set(story.id, {
            ...story,
            isHighlight: false,
            fromAPI: true
          });
        }

        console.log('[Instagram Stories] Found', activeStories.length, 'active stories');
      }
    } catch (error) {
      console.error('[Instagram Stories] Error getting active stories:', error);
    }

    // 3. Get highlights
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
              const highlightStories = highlightMediaData.media?.data || [];
              
              // Process and save highlight stories
              for (const media of highlightStories) {
                // Check if story already exists
                const existingStory = await prisma.instagramStory.findUnique({
                  where: { storyId: media.id }
                });

                if (!existingStory) {
                  // Download image as base64
                  const imageData = await downloadImageAsBase64(media.media_url);
                  
                  // Save to database
                  await prisma.instagramStory.create({
                    data: {
                      accountId: account.id,
                      storyId: media.id,
                      mediaUrl: media.media_url,
                      mediaType: media.media_type,
                      timestamp: new Date(media.timestamp),
                      permalink: media.permalink,
                      imageData,
                      isHighlight: true,
                      highlightTitle: highlight.title || 'Highlight',
                      isActive: true
                    }
                  });
                }

                // Add to map
                storiesMap.set(media.id, {
                  ...media,
                  isHighlight: true,
                  highlightTitle: highlight.title || 'Highlight',
                  fromAPI: true
                });
              }
              
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

    // Convert map to array and sort by timestamp (newest first)
    allStories = Array.from(storiesMap.values());
    allStories.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    console.log('[Instagram Stories] Total stories available:', allStories.length);

    return NextResponse.json({
      stories: allStories
    });

  } catch (error) {
    console.error('[Instagram Stories] Error:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}