import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

const POAP_API_KEY = process.env.POAP_API_KEY;

interface POAPEvent {
  id: number;
  name: string;
  description: string;
  image_url: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  expiry_date: string;
  event_url: string;
  virtual_event: boolean;
  supply: number;
}

export async function GET(request: Request) {
  try {
    // Get dropId from query params if available
    const { searchParams } = new URL(request.url);
    const dropId = searchParams.get('dropId');
    
    let poapEventId: string | undefined;
    
    if (dropId) {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        select: { poapEventId: true }
      });
      poapEventId = drop?.poapEventId;
    } else {
      // Fallback to environment variable for backward compatibility
      poapEventId = process.env.POAP_EVENT_ID;
    }
    
    if (!POAP_API_KEY || !poapEventId) {
      console.error('[POAP Event] Missing configuration:', { hasApiKey: !!POAP_API_KEY, poapEventId });
      return NextResponse.json(
        { error: "POAP API configuration missing" },
        { status: 500 }
      );
    }

    const eventUrl = `https://api.poap.tech/events/id/${poapEventId}`;
    
    const response = await fetch(eventUrl, {
      headers: {
        "X-API-Key": POAP_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[POAP Event] API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('[POAP Event] Error response:', errorText);
      return NextResponse.json(
        { error: "Failed to fetch POAP event data" },
        { status: response.status }
      );
    }

    const eventData: POAPEvent = await response.json();
    
    return NextResponse.json({
      id: eventData.id,
      name: eventData.name,
      description: eventData.description,
      image_url: eventData.image_url,
      event_url: eventData.event_url,
      supply: eventData.supply
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("[POAP Event] Error fetching event data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}