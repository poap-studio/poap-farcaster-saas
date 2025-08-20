import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  
  // Redirect to the drop page with a version parameter to bust cache
  const timestamp = Date.now();
  const dropUrl = `${baseUrl}/drop/${slug}?v=${timestamp}`;
  
  return NextResponse.redirect(dropUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}