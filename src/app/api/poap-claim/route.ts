import { NextResponse } from "next/server";
import { getPoapClaimDetails } from "~/lib/redis";

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

    // Get claim details from Redis
    const claimDetails = await getPoapClaimDetails(fid, POAP_EVENT_ID);

    if (!claimDetails) {
      return NextResponse.json(
        { claimed: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      claimed: true,
      address: claimDetails.address,
      claimedAt: claimDetails.claimedAt,
      txHash: claimDetails.txHash
    });

  } catch (error) {
    console.error("Error checking POAP claim:", error);
    
    return NextResponse.json(
      { error: "Failed to check POAP claim status" },
      { status: 500 }
    );
  }
}