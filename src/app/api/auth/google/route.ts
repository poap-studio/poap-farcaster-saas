import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { createSession } from "~/lib/session";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json(
        { error: "Missing credential" },
        { status: 400 }
      );
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid credential" },
        { status: 400 }
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!googleId || !email) {
      return NextResponse.json(
        { error: "Missing required fields from Google" },
        { status: 400 }
      );
    }

    // Check if user is authorized
    const authorizedUser = await prisma.authorizedUser.findUnique({
      where: { email },
    });

    // For admin access (@poap.fr emails), bypass AuthorizedUser check
    const isAdminEmail = email.endsWith('@poap.fr');
    
    if (!isAdminEmail && (!authorizedUser || !authorizedUser.isActive)) {
      return NextResponse.json(
        { error: "Unauthorized: User not authorized to access this platform" },
        { status: 403 }
      );
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { googleId },
      update: {
        email,
        displayName: name || email.split('@')[0],
        profileImage: picture,
        provider: 'google',
      },
      create: {
        googleId,
        email,
        username: email.split('@')[0], // Use email prefix as username
        displayName: name || email.split('@')[0],
        profileImage: picture,
        provider: 'google',
      },
    });

    // Create session
    await createSession({
      userId: user.id,
      googleId: user.googleId || undefined,
      email: user.email || undefined,
      username: user.username,
      displayName: user.displayName || undefined,
      profileImage: user.profileImage || undefined,
      provider: 'google',
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Google Auth] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}