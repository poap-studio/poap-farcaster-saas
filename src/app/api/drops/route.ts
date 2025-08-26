import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getSessionFromRequest } from "~/lib/session";

// GET all drops for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.userId || request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all drops with counts
    const drops = await prisma.drop.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { 
            claims: true,
            lumaDeliveries: true,
            instagramDeliveries: true
          }
        }
      }
    });

    // Get Instagram stats in bulk using raw query for efficiency
    const instagramDrops = drops.filter(d => d.platform === 'instagram');
    
    const instagramStats: Record<string, { collectors: number; interactions: number }> = {};
    
    if (instagramDrops.length > 0) {
      // Filter out null story IDs
      const validStoryIds = instagramDrops
        .map(d => d.instagramStoryId)
        .filter((id): id is string => id !== null);
      
      let interactionsData: Array<{ story_id: string; count: bigint }> = [];
      let collectorsData: Array<{ drop_id: string; count: bigint }> = [];
      
      if (validStoryIds.length > 0) {
        // Get all interactions count in one query
        interactionsData = await prisma.$queryRaw<Array<{ story_id: string; count: bigint }>>`
          SELECT story_id, COUNT(*)::bigint as count 
          FROM "InstagramMessage" 
          WHERE story_id = ANY(${validStoryIds})
          GROUP BY story_id
        `;
      }
      
      // Get all collectors count in one query  
      collectorsData = await prisma.$queryRaw<Array<{ drop_id: string; count: bigint }>>`
        SELECT drop_id, COUNT(*)::bigint as count
        FROM "InstagramDelivery"
        WHERE drop_id = ANY(${instagramDrops.map(d => d.id)})
        AND delivery_status = 'delivered'
        GROUP BY drop_id
      `;
      
      // Build stats map
      instagramDrops.forEach(drop => {
        const interactions = interactionsData.find(d => d.story_id === drop.instagramStoryId);
        const collectors = collectorsData.find(d => d.drop_id === drop.id);
        
        instagramStats[drop.id] = {
          interactions: Number(interactions?.count || 0),
          collectors: Number(collectors?.count || 0)
        };
      });
    }

    // Merge stats with drops
    const dropsWithStats = drops.map(drop => {
      if (drop.platform === 'instagram' && instagramStats[drop.id]) {
        return {
          ...drop,
          instagramStats: instagramStats[drop.id]
        };
      }
      return drop;
    });

    return NextResponse.json({ drops: dropsWithStats });
  } catch (error) {
    console.error("[Drops GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drops" },
      { status: 500 }
    );
  }
}

// CREATE a new drop
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.userId || request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      poapEventId,
      poapSecretCode,
      buttonColor,
      backgroundColor,
      logoUrl,
      mintMessage,
      disclaimerMessage,
      requireFollow,
      followUsername,
      requireRecast,
      requireQuote,
      platform,
      lumaEventId,
      lumaEventUrl,
      deliveryMethod,
      deliveryTarget,
      emailSubject,
      emailBody,
      isActive,
      // Instagram fields
      instagramAccountId,
      instagramStoryId,
      instagramStoryUrl,
      instagramMessages,
      acceptedFormats,
      sendPoapEmail,
    } = body;

    // Validate required fields
    if (!poapEventId || !poapSecretCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the drop
    const drop = await prisma.drop.create({
      data: {
        userId,
        poapEventId,
        poapSecretCode,
        buttonColor: buttonColor || "#0a5580",
        backgroundColor: backgroundColor || "#073d5c",
        logoUrl,
        mintMessage: mintMessage || "This POAP celebrates the Farcaster community and our journey together.",
        disclaimerMessage: disclaimerMessage || "By minting this POAP you accept these terms: https://poap.xyz/terms",
        requireFollow: requireFollow ?? true,
        followUsername,
        requireRecast: requireRecast ?? true,
        requireQuote: requireQuote ?? false,
        platform: platform || "farcaster",
        lumaEventId,
        lumaEventUrl,
        deliveryMethod,
        deliveryTarget,
        emailSubject,
        emailBody,
        isActive: isActive ?? true,
        // Instagram fields
        instagramAccountId,
        instagramStoryId,
        instagramStoryUrl,
        acceptedFormats: acceptedFormats || ["email"],
        sendPoapEmail: sendPoapEmail ?? true,
      },
    });

    // If it's an Instagram drop, create the messages
    if (platform === "instagram" && instagramMessages) {
      await prisma.instagramDropMessages.create({
        data: {
          dropId: drop.id,
          successMessage: instagramMessages.successMessage,
          alreadyClaimedMessage: instagramMessages.alreadyClaimedMessage,
          invalidFormatMessage: instagramMessages.invalidFormatMessage,
        },
      });
    }

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("[Drops POST] Error:", error);
    console.error("[Drops POST] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create drop" },
      { status: 500 }
    );
  }
}