import { NextResponse } from "next/server";
import { getPOAPAuthManager } from "~/lib/poap-auth";

interface QRCode {
  qr_hash: string;
  secret: string;
  claimed: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const secretCode = searchParams.get("secretCode");

    if (!eventId || !secretCode) {
      return NextResponse.json(
        { error: "Event ID and secret code are required" },
        { status: 400 }
      );
    }

    const poapApiKey = process.env.POAP_API_KEY;
    if (!poapApiKey) {
      throw new Error("POAP API key not configured");
    }

    // Get the auth manager instance
    const authManager = getPOAPAuthManager();

    // Get QR codes for the event
    const qrUrl = `https://api.poap.tech/event/${eventId}/qr-codes`;
    
    const qrResponse = await authManager.makeAuthenticatedRequest(qrUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": poapApiKey,
      },
      body: JSON.stringify({
        secret_code: secretCode,
      }),
    });

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text();
      console.error("QR codes fetch failed:", {
        status: qrResponse.status,
        statusText: qrResponse.statusText,
        error: errorText,
      });
      throw new Error("Unable to fetch POAP codes");
    }

    const qrData = await qrResponse.json() as QRCode[];
    
    const total = qrData.length;
    const claimed = qrData.filter(qr => qr.claimed).length;
    const available = total - claimed;

    return NextResponse.json({
      total,
      claimed,
      available,
    });
  } catch (error) {
    console.error("Error fetching POAP stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch POAP statistics" },
      { status: 500 }
    );
  }
}