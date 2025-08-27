import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getSessionFromRequest } from "~/lib/session";
import { processHistoricalMessagesForDrop } from "~/lib/instagram-message-processor";

// GET all drops for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.userId || request.headers.get("x-user-id");
    
    console.log("[Drops GET] Session:", session);
    console.log("[Drops GET] UserId:", userId);
    
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
        .filter((id): id is string => id !== null && id !== undefined);
      
      let interactionsData: Array<{ story_id: string; count: bigint }> = [];
      let collectorsData: Array<{ drop_id: string; count: bigint }> = [];
      
      if (validStoryIds.length > 0) {
        console.log("[Drops GET] Querying interactions for story IDs:", validStoryIds);
        // Get all interactions count in one query
        interactionsData = await prisma.$queryRaw<Array<{ story_id: string; count: bigint }>>`
          SELECT "storyId" as story_id, COUNT(*)::bigint as count 
          FROM "InstagramMessage" 
          WHERE "storyId" = ANY(${validStoryIds}::text[])
          GROUP BY "storyId"
        `;
      }
      
      // Get all collectors count in one query  
      const dropIds = instagramDrops.map(d => d.id);
      if (dropIds.length > 0) {
        console.log("[Drops GET] Querying collectors for drop IDs:", dropIds);
        collectorsData = await prisma.$queryRaw<Array<{ drop_id: string; count: bigint }>>`
          SELECT "dropId" as drop_id, COUNT(*)::bigint as count
          FROM "InstagramDelivery"
          WHERE "dropId" = ANY(${dropIds}::text[])
          AND "deliveryStatus" = 'delivered'
          GROUP BY "dropId"
        `;
      }
      
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
    console.error("[Drops GET] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch drops";
    const isProduction = process.env.NODE_ENV === 'production';
    
    return NextResponse.json(
      { 
        error: isProduction ? "Failed to fetch drops" : errorMessage,
        details: isProduction ? undefined : error instanceof Error ? error.toString() : String(error)
      },
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

    // Process historical messages for Instagram drops
    if (platform === "instagram" && instagramStoryId) {
      console.log("[Drops POST] Processing historical messages for story:", instagramStoryId);
      
      // Run this asynchronously so we don't block the response
      processHistoricalMessagesForDrop(drop.id)
        .then(result => {
          console.log("[Drops POST] Historical messages processed:", result);
        })
        .catch(error => {
          console.error("[Drops POST] Error processing historical messages:", error);
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