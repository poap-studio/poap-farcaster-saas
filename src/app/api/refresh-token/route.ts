import { NextResponse } from "next/server";
import { getPOAPAuthManager } from "~/lib/poap-auth";
import { getTokenExpirationInfo } from "~/lib/jwt-utils";

export async function POST() {
  try {
    const authManager = getPOAPAuthManager();
    const token = await authManager.getValidToken();
    const tokenInfo = getTokenExpirationInfo(token);
    
    return NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      // Don't include the actual token in response for security
      token_length: token.length,
      token_preview: `${token.substring(0, 10)}...${token.substring(token.length - 10)}`,
      token_info: tokenInfo ? {
        issuer: tokenInfo.issuer,
        audience: tokenInfo.audience,
        scope: tokenInfo.scope,
        issued_at: tokenInfo.issuedAt?.toISOString(),
        expires_at: tokenInfo.expiresAt?.toISOString(),
        is_expired: tokenInfo.isExpired,
        minutes_until_expiry: tokenInfo.timeUntilExpiryMinutes,
      } : null,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to refresh token",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to refresh POAP token",
    endpoint: "/api/refresh-token",
    method: "POST"
  });
} 