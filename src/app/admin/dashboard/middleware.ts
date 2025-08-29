import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // This middleware is just for reference, actual protection is done in the layout
  return NextResponse.next();
}