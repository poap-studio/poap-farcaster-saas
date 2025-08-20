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
    // Get POAP event data
    let poapImageUrl = "";

    if (POAP_API_KEY && POAP_EVENT_ID) {
      try {
        const eventUrl = `https://api.poap.tech/events/id/${POAP_EVENT_ID}`;
        const response = await fetch(eventUrl, {
          headers: {
            "X-API-Key": POAP_API_KEY,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const eventData: POAPEvent = await response.json();
          poapImageUrl = eventData.image_url;
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
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#073d5c",
            position: "relative",
          }}
        >
          {/* Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "absolute",
              top: "220px",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                color: "white",
                fontWeight: "normal",
                marginBottom: "20px",
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
              Arbitrum POAP
            </div>
          </div>

          {/* POAP Image */}
          <img
            src={poapImageUrl}
            alt="POAP"
            style={{
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              objectFit: "cover",
              marginTop: "180px",
            }}
          />
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