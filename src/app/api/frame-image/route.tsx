import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

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

// Function to split text into lines based on max width
function splitTextIntoLines(text: string, maxCharsPerLine: number = 18): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export async function GET(request: NextRequest) {
  try {
    // Get dropId and slug from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const dropId = searchParams.get('dropId');
    const slug = searchParams.get('slug');
    
    // Get POAP event data
    let poapImageUrl = "";
    let eventId = POAP_EVENT_ID;
    let dropBackgroundColor = "#073d5c"; // default
    let dropLogoUrl = "";
    let poapEventName = "POAP";

    // If slug is provided, fetch drop data by slug first
    if (slug) {
      try {
        const dropResponse = await fetch(`${request.nextUrl.origin}/api/drops/slug/${slug}`);
        if (dropResponse.ok) {
          const { drop } = await dropResponse.json();
          eventId = drop.poapEventId;
          dropBackgroundColor = drop.backgroundColor || "#073d5c";
          dropLogoUrl = drop.logoUrl || "";
          console.log('[Frame Image] Using drop from slug:', slug, 'colors:', dropBackgroundColor);
        }
      } catch (error) {
        console.error("[Frame Image] Error fetching drop data by slug:", error);
      }
    } else if (dropId) {
      // Fallback to dropId if no slug provided
      try {
        const dropResponse = await fetch(`${request.nextUrl.origin}/api/drops/${dropId}`);
        if (dropResponse.ok) {
          const { drop } = await dropResponse.json();
          eventId = drop.poapEventId;
          dropBackgroundColor = drop.backgroundColor || "#073d5c";
          dropLogoUrl = drop.logoUrl || "";
          console.log('[Frame Image] Using drop colors:', dropBackgroundColor);
        }
      } catch (error) {
        console.error("[Frame Image] Error fetching drop data:", error);
      }
    }

    if (POAP_API_KEY && eventId) {
      try {
        const eventUrl = `https://api.poap.tech/events/id/${eventId}`;
        const response = await fetch(eventUrl, {
          headers: {
            "X-API-Key": POAP_API_KEY,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const eventData: POAPEvent = await response.json();
          poapImageUrl = eventData.image_url;
          poapEventName = eventData.name || "POAP";
        }
      } catch (error) {
        console.error("[Frame Image] Error fetching POAP data:", error);
      }
    }

    // If no POAP image URL, use fallback
    if (!poapImageUrl) {
      poapImageUrl = `${request.nextUrl.origin}/poap-image0.png`;
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dropBackgroundColor,
            padding: "60px",
            position: "relative",
          }}
        >
          {/* Logo in top left corner */}
          {dropLogoUrl && (
            <img
              src={dropLogoUrl}
              alt="Logo"
              style={{
                position: "absolute",
                top: "40px",
                left: "40px",
                width: "80px",
                height: "80px",
                objectFit: "contain",
              }}
            />
          )}
          {/* Add unique identifier to prevent cache */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "monospace",
            }}
          >
            {slug ? `Drop: ${slug}` : dropId ? `Drop: ${dropId.slice(-6)}` : "Default"}
          </div>
          {/* POAP Image on the left */}
          <img
            src={poapImageUrl}
            alt="POAP"
            style={{
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              objectFit: "cover",
              marginRight: "80px",
            }}
          />

          {/* Text on the right */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              position: "relative",
              maxWidth: "600px",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                color: "white",
                fontWeight: "normal",
                marginBottom: "10px",
              }}
            >
              Get your
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              {splitTextIntoLines(poapEventName, 16).map((line, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "64px",
                    color: "white",
                    fontWeight: "bold",
                    lineHeight: "1.1",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error("[Frame Image] Error generating image:", error);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#073d5c",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            POAP Frame
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}