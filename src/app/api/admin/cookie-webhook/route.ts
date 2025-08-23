import { NextResponse } from "next/server";
import { LumaCookieManager } from "~/lib/luma-cookie";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, cookie, status, error, expiresAt, timestamp } = body;

    // Validate webhook secret
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const manager = LumaCookieManager.getInstance();

    if (status === 'success' && cookie) {
      // Parse expiration date if provided
      const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
      
      // Update cookie in database and memory
      await manager.setCookie(cookie, expirationDate);
      
      console.log("Luma cookie updated successfully via webhook");
      console.log("Cookie expires at:", expirationDate);
      console.log("Webhook timestamp:", timestamp);
      
      return NextResponse.json({ 
        success: true,
        message: "Cookie updated",
        expiresAt: expirationDate
      });
    } else if (status === 'error') {
      console.error("Cookie update failed:", error);
      
      // Could send notification to admin here
      
      return NextResponse.json({ 
        success: false,
        message: "Cookie update failed",
        error: error
      });
    }

    return NextResponse.json({ 
      error: "Invalid webhook payload" 
    }, { status: 400 });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}