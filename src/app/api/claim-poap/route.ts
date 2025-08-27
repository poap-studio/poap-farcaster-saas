import { NextResponse } from "next/server";
import { getPOAPAuthManager } from "~/lib/poap-auth";
import { prisma } from "~/lib/prisma";
import { getUserProfile } from "~/lib/neynar";
import { emitDropUpdate } from "~/lib/events";
import { checkPOAPOwnership } from "~/lib/poap-duplicate-check";

interface QRCode {
  qr_hash: string;
  secret: string;
  claimed: boolean;
}

export async function POST(request: Request) {
  try {
    const { address, txHash, fid, dropId } = await request.json();

    if (!address || !txHash) {
      return NextResponse.json(
        { error: "Address and transaction hash are required" },
        { status: 400 }
      );
    }

    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { error: "Valid Farcaster user ID (fid) is required" },
        { status: 400 }
      );
    }

    // Get POAP configuration from database or environment
    const poapApiKey = process.env.POAP_API_KEY;
    let poapEventId: string | undefined;
    let poapSecretCode: string | undefined;

    if (dropId) {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        select: { poapEventId: true, poapSecretCode: true }
      });
      
      if (!drop) {
        return NextResponse.json(
          { error: "Drop not found" },
          { status: 404 }
        );
      }
      
      poapEventId = drop.poapEventId;
      poapSecretCode = drop.poapSecretCode;
    } else {
      // Fallback to environment variables for backward compatibility
      poapEventId = process.env.POAP_EVENT_ID;
      poapSecretCode = process.env.POAP_SECRET_CODE;
    }

    if (!poapApiKey || !poapEventId || !poapSecretCode) {
      console.error("Missing POAP configuration:", {
        hasApiKey: !!poapApiKey,
        hasEventId: !!poapEventId,
        hasSecretCode: !!poapSecretCode
      });
      throw new Error("POAP configuration incomplete");
    }

    // Check if address already owns this POAP
    console.log(`[POAP Claim] Checking if address ${address} already owns POAP for event ${poapEventId}`);
    const ownershipCheck = await checkPOAPOwnership(address, poapEventId);
    if (ownershipCheck.hasPoap) {
      console.log(`[POAP Claim] Address ${address} already owns POAP for event ${poapEventId}`);
      return NextResponse.json(
        { error: "This address already owns this POAP" },
        { status: 409 }
      );
    }

    // Check if user has already claimed this drop
    console.log(`[POAP Claim] Checking if FID ${fid} has already claimed drop ${dropId}`);
    
    const existingClaim = await prisma.claim.findFirst({
      where: {
        dropId: dropId || undefined,
        fid: fid
      }
    });
    
    if (existingClaim) {
      console.log(`[POAP Claim] User ${fid} has already claimed drop ${dropId}`);
      return NextResponse.json(
        { error: "You have already claimed this POAP" },
        { status: 409 }
      );
    }

    // Get the auth manager instance
    const authManager = getPOAPAuthManager();

    // First get QR codes for the event
    const qrUrl = `https://api.poap.tech/event/${poapEventId}/qr-codes`;
    console.log("Fetching QR codes from:", qrUrl);
    
    const qrResponse = await authManager.makeAuthenticatedRequest(qrUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": poapApiKey,
      },
      body: JSON.stringify({
        secret_code: poapSecretCode,
      }),
    });

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text();
      console.error("QR codes fetch failed:", {
        status: qrResponse.status,
        statusText: qrResponse.statusText,
        error: errorText,
        url: qrUrl
      });
      throw new Error("Unable to fetch POAP codes");
    }

    const qrData = await qrResponse.json() as QRCode[];
    console.log("QR codes fetched:", {
      total: qrData.length,
      available: qrData.filter(qr => !qr.claimed).length
    });

    const availableQr = qrData.find((qr) => !qr.claimed);

    if (!availableQr) {
      console.log("No available QR codes found");
      return NextResponse.json(
        { error: "No more POAPs left to claim." },
        { status: 400 }
      );
    }

    // Claim the POAP
    const claimUrl = "https://api.poap.tech/actions/claim-qr";
    console.log("Claiming POAP:", {
      address,
      qr_hash: availableQr.qr_hash,
      url: claimUrl
    });

    const claimResponse = await authManager.makeAuthenticatedRequest(claimUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": poapApiKey,
      },
      body: JSON.stringify({
        address,
        qr_hash: availableQr.qr_hash,
        secret: availableQr.secret,
        sendEmail: true,
      }),
    });

    if (!claimResponse.ok) {
      const errorText = await claimResponse.text();
      console.error("POAP claim failed:", {
        status: claimResponse.status,
        statusText: claimResponse.statusText,
        error: errorText,
        url: claimUrl
      });
      throw new Error("Unable to claim POAP");
    }

    const claimData = await claimResponse.json();
    console.log("POAP claimed successfully:", claimData);

    // Get user profile from Farcaster
    let userProfile = { username: null as string | null, followers: null as number | null };
    try {
      userProfile = await getUserProfile(fid);
      console.log(`[POAP Claim] Found profile for FID ${fid}: username=${userProfile.username}, followers=${userProfile.followers}`);
    } catch (error) {
      console.warn(`[POAP Claim] Failed to get user profile for FID ${fid}`, error);
    }

    // Record the claim in database
    try {
      await prisma.claim.create({
        data: {
          dropId: dropId!,
          fid: fid,
          username: userProfile.username,
          followers: userProfile.followers,
          address: address,
          txHash: txHash
        }
      });
      console.log(`[POAP Claim] Recorded claim for FID ${fid}, Drop ${dropId}, Username ${userProfile.username}, Followers ${userProfile.followers}`);
      
      // Emit real-time update for successful claim
      if (dropId) {
        emitDropUpdate(dropId, 'collector');
        console.log(`[POAP Claim] Emitted collector update for drop: ${dropId}`);
      }
    } catch (error) {
      console.warn(`[POAP Claim] Failed to record claim in database for FID ${fid}, but POAP was claimed successfully`, error);
    }

    return NextResponse.json({
      success: true,
      message: "POAP claimed successfully",
      data: claimData,
    });
  } catch (error) {
    console.error("Error claiming POAP:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return NextResponse.json(
      { error: "Failed to claim POAP. Please try again later." },
      { status: 500 }
    );
  }
} 