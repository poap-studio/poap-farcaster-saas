import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  
  // Generate unique timestamp and random ID for cache busting
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  // Get the base URL from the request to ensure it works in all environments
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  const dropUrl = `${baseUrl}/drop/${slug}?t=${timestamp}&rid=${randomId}&src=share`;
  
  return NextResponse.redirect(dropUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}