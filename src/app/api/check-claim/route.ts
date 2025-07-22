import { NextResponse } from "next/server";
import { hasUserClaimedPoap } from "~/lib/redis";

const POAP_EVENT_ID = process.env.POAP_EVENT_ID;

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { error: "Valid Farcaster user ID (fid) is required" },
        { status: 400 }
      );
    }

    if (!POAP_EVENT_ID) {
      return NextResponse.json(
        { error: "POAP event not configured" },
        { status: 500 }
      );
    }

    // Check if user has already claimed this POAP event
    console.log(`[Check Claim] Checking if FID ${fid} has already claimed event ${POAP_EVENT_ID}`);
    const hasAlreadyClaimed = await hasUserClaimedPoap(fid, POAP_EVENT_ID);

    return NextResponse.json({
      hasClaimedCurrentEvent: hasAlreadyClaimed,
      eventId: POAP_EVENT_ID
    });
  } catch (error) {
    console.error("Error checking POAP claim:", error);
    
    return NextResponse.json(
      { error: "Failed to check claim status" },
      { status: 500 }
    );
  }
}