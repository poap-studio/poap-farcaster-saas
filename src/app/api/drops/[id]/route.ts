import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getSessionFromRequest } from "~/lib/session";

// GET a single drop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const drop = await prisma.drop.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!drop) {
      return NextResponse.json(
        { error: "Drop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("[Drop GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drop" },
      { status: 500 }
    );
  }
}

// UPDATE a drop
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.userId || request.headers.get("x-user-id");
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Verify ownership
    const existingDrop = await prisma.drop.findUnique({
      where: { id },
    });

    if (!existingDrop || existingDrop.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const drop = await prisma.drop.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("[Drop PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update drop" },
      { status: 500 }
    );
  }
}

// DELETE a drop
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.userId || request.headers.get("x-user-id");
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingDrop = await prisma.drop.findUnique({
      where: { id },
    });

    if (!existingDrop || existingDrop.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.drop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Drop DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete drop" },
      { status: 500 }
    );
  }
}