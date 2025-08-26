import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { prisma } from "~/lib/prisma";

export async function GET() {
  console.log('=== DEBUG SESSION ENDPOINT CALLED ===');
  
  const session = await getSession();
  
  console.log('Session data:', session);
  
  if (!session) {
    return NextResponse.json({ 
      message: "No session found",
      authenticated: false 
    });
  }

  // Get user from database
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        drops: {
          select: {
            id: true,
            platform: true,
            createdAt: true
          }
        }
      }
    });

    console.log('User from DB:', user);

    return NextResponse.json({ 
      message: "Debug session info",
      session,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        provider: user.provider,
        googleId: user.googleId,
        dropCount: user.drops.length,
        drops: user.drops
      } : null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      message: "Error fetching user",
      session,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}