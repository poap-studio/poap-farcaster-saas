import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { fetchLumaEvent, fetchLumaGuests } from "~/lib/luma-cookie";

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
        host.host_info?.email === 'admin@poap.fr'
      );

      if (!isHost) {
        return NextResponse.json({ 
          error: "POAP Studio (admin@poap.fr) must be added as a Manager to this event",
          showLumaGuide: true
        }, { status: 403 });
      }
      
      // Check if admin@poap.fr has manager access
      const hasManagerAccess = eventData.hosts.some(host => 
        host.host_info?.email === 'admin@poap.fr' && 
        host.host_info?.is_manager === true
      );
      
      if (!hasManagerAccess) {
        return NextResponse.json({ 
          error: "POAP Studio (admin@poap.fr) must have Manager access level",
          showLumaGuide: true
        }, { status: 403 });
      }

      // Fetch guest details
      let guestStats = {
        total: 0,
        going: 0,
        checkedIn: 0,
        registered: 0
      };

      try {
        const guests = await fetchLumaGuests(eventId);
        console.log(`Fetched ${guests.length} guests for event ${eventId}`);
        guestStats = {
          total: guests.length,
          going: guests.length, // All fetched guests are "going"
          checkedIn: guests.filter(g => g.checked_in_at !== null).length,
          registered: guests.filter(g => g.registered_at).length
        };
        console.log('Guest stats:', guestStats);
      } catch (error) {
        console.error("Error fetching guest details:", error);
      }

      return NextResponse.json({ 
        success: true,
        event: {
          ...eventData.event,
          guests_count: eventData.guests_count,
          guestStats
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('owner or co-host')) {
        return NextResponse.json({ 
          error: "You don't have access to this event. Make sure POAP Studio (admin@poap.fr) is added as a Manager.",
          showLumaGuide: true
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