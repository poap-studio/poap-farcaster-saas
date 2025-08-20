import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

// GET all drops for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const drops = await prisma.drop.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { claims: true }
        }
      }
    });

    return NextResponse.json({ drops });
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
    const userId = request.headers.get("x-user-id");
    
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
      requireFollow,
      followUsername,
      requireRecast,
    } = body;

    // Validate required fields
    if (!poapEventId || !poapSecretCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const drop = await prisma.drop.create({
      data: {
        userId,
        poapEventId,
        poapSecretCode,
        buttonColor: buttonColor || "#0a5580",
        backgroundColor: backgroundColor || "#073d5c",
        logoUrl,
        mintMessage: mintMessage || "This POAP celebrates the Farcaster community and our journey together.",
        requireFollow: requireFollow ?? true,
        followUsername,
        requireRecast: requireRecast ?? true,
      },
    });

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("[Drops POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create drop" },
      { status: 500 }
    );
  }
}