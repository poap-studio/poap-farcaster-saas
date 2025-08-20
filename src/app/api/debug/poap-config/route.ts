import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dropId = searchParams.get('dropId');
    
    // Check environment variables
    const hasApiKey = !!process.env.POAP_API_KEY;
    const defaultEventId = process.env.POAP_EVENT_ID;
    
    let dropEventId = null;
    if (dropId) {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        select: { poapEventId: true }
      });
      dropEventId = drop?.poapEventId;
    }
    
    const finalEventId = dropEventId || defaultEventId;
    
    // Try to fetch from POAP API if configured
    let poapApiStatus = 'not_configured';
    let poapEventData = null;
    let poapApiError = null;
    
    if (hasApiKey && finalEventId) {
      try {
        const eventUrl = `https://api.poap.tech/events/id/${finalEventId}`;
        const response = await fetch(eventUrl, {
          headers: {
            "X-API-Key": process.env.POAP_API_KEY!,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          poapApiStatus = 'success';
          poapEventData = await response.json();
        } else {
          poapApiStatus = 'error';
          poapApiError = `${response.status} ${response.statusText}`;
        }
      } catch (error) {
        poapApiStatus = 'error';
        poapApiError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      configuration: {
        hasApiKey,
        defaultEventId,
        dropEventId,
        finalEventId,
      },
      poapApi: {
        status: poapApiStatus,
        error: poapApiError,
        eventData: poapEventData,
      },
      debug: {
        dropId,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error("[Debug POAP Config] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}