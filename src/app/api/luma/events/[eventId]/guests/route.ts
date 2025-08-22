import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchLumaGuests } from "@/lib/luma-cookie";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dropId = searchParams.get('dropId');
    const checkedInOnly = searchParams.get('checkedInOnly') === 'true';

    // If dropId provided, verify ownership
    if (dropId) {
      const drop = await prisma.drop.findFirst({
        where: {
          id: dropId,
          userId: session.user.id,
          platform: 'luma'
        }
      });

      if (!drop) {
        return NextResponse.json({ error: "Drop not found" }, { status: 404 });
      }
    }

    const guests = await fetchLumaGuests(params.eventId);

    // Filter by check-in status if requested
    let filteredGuests = guests;
    if (checkedInOnly) {
      filteredGuests = guests.filter(guest => guest.checked_in_at !== null);
    }

    // Get already delivered POAPs if dropId provided
    let deliveredGuests = new Set<string>();
    if (dropId) {
      const deliveries = await prisma.lumaDelivery.findMany({
        where: { dropId },
        select: { guestId: true }
      });
      deliveredGuests = new Set(deliveries.map(d => d.guestId));
    }

    // Format response
    const formattedGuests = filteredGuests.map(guest => ({
      ...guest,
      delivered: deliveredGuests.has(guest.api_id)
    }));

    return NextResponse.json({
      guests: formattedGuests,
      total: guests.length,
      checkedIn: guests.filter(g => g.checked_in_at).length,
      delivered: deliveredGuests.size
    });

  } catch (error: any) {
    console.error("Error fetching Luma guests:", error);
    
    if (error.message.includes('No Luma cookie')) {
      return NextResponse.json({ 
        error: "Luma authentication expired. Please contact admin." 
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}