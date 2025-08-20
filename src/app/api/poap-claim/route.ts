import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function POST(request: Request) {
  try {
    const { fid, dropId } = await request.json();

    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { error: "Valid Farcaster user ID (fid) is required" },
        { status: 400 }
      );
    }

    // If dropId is provided, get POAP event ID from database
    let poapEventId: string | undefined;
    if (dropId) {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        select: { poapEventId: true }
      });
      poapEventId = drop?.poapEventId;
    } else {
      // Fallback to environment variable for backward compatibility
      poapEventId = process.env.POAP_EVENT_ID;
    }

    if (!poapEventId) {
      return NextResponse.json(
        { error: "POAP event not configured" },
        { status: 500 }
      );
    }

    // Get claim details from database
    const claim = await prisma.claim.findFirst({
      where: {
        dropId: dropId || undefined,
        fid: fid
      },
      include: {
        drop: dropId ? false : true
      }
    });

    // If no dropId provided, check if the claim is for the correct event
    if (!dropId && claim && claim.drop && claim.drop.poapEventId !== poapEventId) {
      return NextResponse.json(
        { claimed: false },
        { status: 200 }
      );
    }

    if (!claim) {
      return NextResponse.json(
        { claimed: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      claimed: true,
      address: claim.address,
      claimedAt: claim.claimedAt.toISOString(),
      txHash: claim.txHash
    });

  } catch (error) {
    console.error("Error checking POAP claim:", error);
    
    return NextResponse.json(
      { error: "Failed to check POAP claim status" },
      { status: 500 }
    );
  }
}