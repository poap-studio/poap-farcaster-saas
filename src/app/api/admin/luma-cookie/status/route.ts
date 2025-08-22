import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LumaCookieManager } from "@/lib/luma-cookie";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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