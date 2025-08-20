import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

// GET a single drop
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drop = await prisma.drop.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Verify ownership
    const existingDrop = await prisma.drop.findUnique({
      where: { id: params.id },
    });

    if (!existingDrop || existingDrop.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const drop = await prisma.drop.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingDrop = await prisma.drop.findUnique({
      where: { id: params.id },
    });

    if (!existingDrop || existingDrop.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.drop.delete({
      where: { id: params.id },
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