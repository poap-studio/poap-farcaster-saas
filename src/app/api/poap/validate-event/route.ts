import { NextRequest, NextResponse } from "next/server";

const POAP_API_KEY = process.env.POAP_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId" },
        { status: 400 }
      );
    }

    if (!POAP_API_KEY) {
      return NextResponse.json(
        { error: "POAP API key not configured" },
        { status: 500 }
      );
    }

    const eventUrl = `https://api.poap.tech/events/id/${eventId}`;
    const eventResponse = await fetch(eventUrl, {
      headers: {
        "X-API-Key": POAP_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!eventResponse.ok) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const eventData = await eventResponse.json();
    
    return NextResponse.json({ 
      event: {
        id: eventData.id,
        name: eventData.name,
        image_url: eventData.image_url,
      }
    });
  } catch (error) {
    console.error("[POAP Validate GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get POAP event" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, secretCode } = body;

    if (!eventId || !secretCode) {
      return NextResponse.json(
        { error: "Missing eventId or secretCode" },
        { status: 400 }
      );
    }

    if (!POAP_API_KEY) {
      return NextResponse.json(
        { error: "POAP API key not configured" },
        { status: 500 }
      );
    }

    // Validate event exists
    const eventUrl = `https://api.poap.tech/events/id/${eventId}`;
    const eventResponse = await fetch(eventUrl, {
      headers: {
        "X-API-Key": POAP_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!eventResponse.ok) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const eventData = await eventResponse.json();

    // Here we would validate the secret code, but POAP API doesn't provide
    // a direct endpoint for this. In production, you'd need to attempt
    // a test claim or have another validation method.
    
    return NextResponse.json({ 
      valid: true,
      event: {
        id: eventData.id,
        name: eventData.name,
        image_url: eventData.image_url,
      }
    });
  } catch (error) {
    console.error("[POAP Validate] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate POAP event" },
      { status: 500 }
    );
  }
}