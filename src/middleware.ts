import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Apply no-cache headers to frame pages and API routes
  if (
    request.nextUrl.pathname.startsWith('/drop/') ||
    request.nextUrl.pathname.startsWith('/f/') ||
    request.nextUrl.pathname.startsWith('/api/frame-image') ||
    request.nextUrl.pathname.startsWith('/api/drops/slug/')
  ) {
    const response = NextResponse.next();
    
    // Set aggressive no-cache headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Frame-Options', 'ALLOWALL'); // Allow frames
    
    // Add timestamp to vary the response
    response.headers.set('X-Timestamp', Date.now().toString());
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/drop/:path*',
    '/f/:path*',
    '/api/frame-image',
    '/api/drops/slug/:path*',
  ],
};