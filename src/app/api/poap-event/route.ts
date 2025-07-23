import { NextResponse } from "next/server";

const POAP_API_KEY = process.env.POAP_API_KEY;
const POAP_EVENT_ID = process.env.POAP_EVENT_ID;

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

export async function GET() {
  try {
    if (!POAP_API_KEY || !POAP_EVENT_ID) {
      return NextResponse.json(
        { error: "POAP API configuration missing" },
        { status: 500 }
      );
    }

    const eventUrl = `https://api.poap.tech/events/id/${POAP_EVENT_ID}`;
    
    const response = await fetch(eventUrl, {
      headers: {
        "X-API-Key": POAP_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[POAP Event] API error: ${response.status} ${response.statusText}`);
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
    });

  } catch (error) {
    console.error("[POAP Event] Error fetching event data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}