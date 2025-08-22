import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { LumaCookieManager } from "~/lib/luma-cookie";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const manager = LumaCookieManager.getInstance();
    const cookie = manager.getCookie();
    const hasEnvCookie = !!process.env.LUMA_SESSION_COOKIE;
    
    let isValid = false;
    if (cookie) {
      isValid = await manager.validateCookie();
    }

    return NextResponse.json({
      isValid,
      hasEnvCookie,
      cookiePresent: !!cookie
    });

  } catch (error) {
    console.error("Error checking cookie status:", error);
    return NextResponse.json(
      { error: "Failed to check cookie status" },
      { status: 500 }
    );
  }
}