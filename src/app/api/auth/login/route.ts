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
      },
      create: {
        fid: parseInt(fid),
        username,
        displayName,
        profileImage,
      },
    });

    // Create session
    await createSession({
      userId: user.id,
      fid: user.fid,
      username: user.username,
      displayName: user.displayName || undefined,
      profileImage: user.profileImage || undefined,
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