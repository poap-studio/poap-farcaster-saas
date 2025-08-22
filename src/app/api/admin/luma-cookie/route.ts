import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { LumaCookieManager } from "~/lib/luma-cookie";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Add admin check here
    // if (!isAdmin(session.user)) {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    const { cookie } = await request.json();

    if (!cookie || !cookie.includes("luma.auth-session-key=")) {
      return NextResponse.json({ 
        error: "Invalid cookie format" 
      }, { status: 400 });
    }

    // Update cookie in manager
    const manager = LumaCookieManager.getInstance();
    manager.setCookie(cookie);

    // Validate the new cookie
    const isValid = await manager.validateCookie();

    if (!isValid) {
      return NextResponse.json({ 
        error: "Cookie validation failed. Please check the cookie is correct." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Cookie updated successfully"
    });

  } catch (error) {
    console.error("Error updating Luma cookie:", error);
    return NextResponse.json(
      { error: "Failed to update cookie" },
      { status: 500 }
    );
  }
}