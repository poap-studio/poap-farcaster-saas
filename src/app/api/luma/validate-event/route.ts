import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { fetchLumaEvent } from "~/lib/luma-cookie";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    try {
      const eventData = await fetchLumaEvent(eventId);
      
      // Check if admin@poap.fr is a host
      const isHost = eventData.hosts.some(host => 
        host.email === 'admin@poap.fr'
      );

      if (!isHost) {
        return NextResponse.json({ 
          error: "admin@poap.fr must be a co-host of this event" 
        }, { status: 403 });
      }

      return NextResponse.json({ 
        success: true,
        event: {
          ...eventData.event,
          guests_count: eventData.guests_count
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('owner or co-host')) {
        return NextResponse.json({ 
          error: "You don't have access to this event. Make sure admin@poap.fr is a co-host." 
        }, { status: 403 });
      }
      
      if ((error as Error).message.includes('No Luma cookie')) {
        return NextResponse.json({ 
          error: "Luma authentication expired. Please contact admin." 
        }, { status: 503 });
      }

      throw error;
    }
  } catch (error) {
    console.error("Error validating Luma event:", error);
    return NextResponse.json(
      { error: "Failed to validate event" },
      { status: 500 }
    );
  }
}