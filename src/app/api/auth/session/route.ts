import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { prisma } from "~/lib/prisma";

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Get fresh user data from database
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fid: true,
        username: true,
        displayName: true,
        profileImage: true,
      }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Return fresh user data with session structure
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,  // Changed from userId to id for consistency
        userId: user.id,  // Keep both for backward compatibility
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
      }
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    // Fallback to session data if database query fails
    return NextResponse.json({ 
      authenticated: true,
      user: session 
    });
  }
}