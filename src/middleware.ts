import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '~/lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Handle admin routes - removed middleware checks
  // Admin access is now handled in the layout component
  if (path.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  if (path.startsWith('/dashboard') || path.startsWith('/drops')) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Apply no-cache headers to frame pages and API routes
  if (
    path.startsWith('/drop/') ||
    path.startsWith('/f/') ||
    path.startsWith('/api/frame-image') ||
    path.startsWith('/api/drops/slug/')
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
    '/dashboard/:path*',
    '/drops/:path*',
    '/drop/:path*',
    '/f/:path*',
    '/api/frame-image',
    '/api/drops/slug/:path*',
    '/admin/:path*',
  ],
};