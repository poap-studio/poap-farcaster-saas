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

export async function GET(request: NextRequest) {
  try {
    // Get dropId from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const dropId = searchParams.get('dropId');
    
    // Get POAP event data
    let poapImageUrl = "";
    let eventId = POAP_EVENT_ID;
    let dropBackgroundColor = "#073d5c"; // default
    let dropLogoUrl = "";
    let poapEventName = "POAP";

    // If dropId is provided, fetch drop data
    if (dropId) {
      try {
        const dropResponse = await fetch(`${request.nextUrl.origin}/api/drops/${dropId}`);
        if (dropResponse.ok) {
          const { drop } = await dropResponse.json();
          eventId = drop.poapEventId;
          dropBackgroundColor = drop.backgroundColor || "#073d5c";
          dropLogoUrl = drop.logoUrl || "";
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
          }}
        >
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
                fontSize: "64px",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {poapEventName}
            </div>
            {dropLogoUrl && (
              <img
                src={dropLogoUrl}
                alt="Logo"
                style={{
                  position: "absolute",
                  bottom: "-40px",
                  right: "-100px",
                  width: "80px",
                  height: "80px",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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
      }
    );
  }
}