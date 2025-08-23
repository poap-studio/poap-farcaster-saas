import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { prisma } from "~/lib/prisma";
import { syncLumaGuests } from "~/lib/luma-sync";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dropIds } = await request.json();

    if (!Array.isArray(dropIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get all Luma drops for this user
    const drops = await prisma.drop.findMany({
      where: {
        id: { in: dropIds },
        userId: session.userId,
        platform: 'luma',
        lumaEventId: { not: null }
      }
    });

    const results = [];

    // Sync guests for each drop
    for (const drop of drops) {
      if (drop.lumaEventId) {
        const result = await syncLumaGuests(drop.id, drop.lumaEventId);
        results.push({
          dropId: drop.id,
          ...result
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error syncing Luma guests:", error);
    return NextResponse.json(
      { error: "Failed to sync guests" },
      { status: 500 }
    );
  }
}