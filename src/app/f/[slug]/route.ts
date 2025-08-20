import { NextRequest, NextResponse } from "next/server";

// Redirect endpoint with cache busting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  
  // Add random parameter to force new cache entry
  const randomId = Math.random().toString(36).substring(7);
  const dropUrl = `${baseUrl}/drop/${slug}?fc=${randomId}`;
  
  // Redirect with no-cache headers
  return NextResponse.redirect(dropUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Vary': '*',
    },
  });
}