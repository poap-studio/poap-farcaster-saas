import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { createSession } from "~/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, displayName, profileImage } = body;

    if (!fid || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { fid: parseInt(fid) },
      update: {
        username,
        displayName,
        profileImage,
        provider: 'farcaster',
      },
      create: {
        fid: parseInt(fid),
        username,
        displayName,
        profileImage,
        provider: 'farcaster',
      },
    });

    // Check if user is authorized
    if (user.email) {
      const authorizedUser = await prisma.authorizedUser.findUnique({
        where: { email: user.email },
      });

      if (!authorizedUser || !authorizedUser.isActive) {
        return NextResponse.json(
          { error: "Unauthorized: User not authorized to access this platform" },
          { status: 403 }
        );
      }
    } else {
      // If user doesn't have email, check by username
      const authorizedUser = await prisma.authorizedUser.findFirst({
        where: { username: user.username },
      });

      if (!authorizedUser || !authorizedUser.isActive) {
        return NextResponse.json(
          { error: "Unauthorized: User not authorized to access this platform" },
          { status: 403 }
        );
      }
    }

    // Create session
    await createSession({
      userId: user.id,
      fid: user.fid || undefined,
      username: user.username,
      displayName: user.displayName || undefined,
      profileImage: user.profileImage || undefined,
      provider: 'farcaster',
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[Auth Login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}