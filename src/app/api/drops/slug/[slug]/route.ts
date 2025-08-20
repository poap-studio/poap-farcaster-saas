import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const drop = await prisma.drop.findUnique({
      where: { 
        slug: params.slug,
        isActive: true,
      },
    });

    if (!drop) {
      return NextResponse.json(
        { error: "Drop not found" },
        { status: 404 }
      );
    }

    // Don't expose sensitive data in public endpoint
    const { poapSecretCode, ...publicDrop } = drop;

    return NextResponse.json({ drop: publicDrop });
  } catch (error) {
    console.error("[Drop Slug GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drop" },
      { status: 500 }
    );
  }
}