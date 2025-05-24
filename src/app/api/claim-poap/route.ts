import { NextResponse } from "next/server";
import { getPOAPAuthManager } from "~/lib/poap-auth";

const POAP_API_KEY = process.env.POAP_API_KEY;
const POAP_EVENT_ID = "190074";
const POAP_SECRET_CODE = "412350";

interface QRCode {
  qr_hash: string;
  secret: string;
  claimed: boolean;
}

export async function POST(request: Request) {
  try {
    const { address, txHash } = await request.json();

    if (!address || !txHash) {
      return NextResponse.json(
        { error: "Address and transaction hash are required" },
        { status: 400 }
      );
    }

    if (!POAP_API_KEY) {
      console.error("Missing POAP API key");
      throw new Error("POAP API credentials not configured");
    }

    // Get the auth manager instance
    const authManager = getPOAPAuthManager();

    // First get QR codes for the event
    const qrUrl = `https://api.poap.tech/event/${POAP_EVENT_ID}/qr-codes`;
    console.log("Fetching QR codes from:", qrUrl);
    
    const qrResponse = await authManager.makeAuthenticatedRequest(qrUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": POAP_API_KEY,
      },
      body: JSON.stringify({
        secret_code: POAP_SECRET_CODE,
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
        { error: "No available POAPs left" },
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
        "X-API-Key": POAP_API_KEY,
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