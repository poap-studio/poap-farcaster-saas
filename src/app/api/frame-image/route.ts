import { NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

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
    // Skip font registration - will draw text without custom fonts
    
    // Get POAP event data
    let poapImageUrl = '';
    
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
        console.error('[Frame Image] Error fetching POAP data:', error);
      }
    }

    // Create canvas
    const canvas = createCanvas(1200, 630); // Standard Open Graph size
    const ctx = canvas.getContext('2d');

    // Fill background with solid color #073d5c (same as claim button)
    ctx.fillStyle = '#073d5c';
    ctx.fillRect(0, 0, 1200, 630);

    // Create SVG with text and render it
    const svgText = `
      <svg width="1200" height="200" xmlns="http://www.w3.org/2000/svg">
        <text x="600" y="50" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle">Get your</text>
        <text x="600" y="120" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">Arbitrum POAP</text>
      </svg>
    `;
    
    try {
      const textBuffer = Buffer.from(svgText);
      const textImage = await loadImage(textBuffer);
      ctx.drawImage(textImage, 0, 200);
    } catch (svgError) {
      console.error('[Frame Image] Error rendering SVG text:', svgError);
    }

    // Try to load and draw POAP image
    try {
      let poapImage;
      
      if (poapImageUrl) {
        // Try to load POAP from API
        poapImage = await loadImage(poapImageUrl);
      } else {
        // Fallback to local POAP image
        const fallbackPoapPath = path.join(process.cwd(), 'public', 'poap-image0.png');
        poapImage = await loadImage(fallbackPoapPath);
      }
      
      // Draw POAP image centered, circular
      const poapSize = 400;
      const poapX = (1200 - poapSize) / 2; // Centered horizontally
      const poapY = (630 - poapSize) / 2; // Centered vertically
      
      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(poapX + poapSize/2, poapY + poapSize/2, poapSize/2, 0, 2 * Math.PI);
      ctx.clip();
      
      // Draw POAP image
      ctx.drawImage(poapImage, poapX, poapY, poapSize, poapSize);
      ctx.restore();
    } catch (error) {
      console.error('[Frame Image] Error loading POAP image:', error);
      // Continue without POAP image - just show background
    }


    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Return image response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // No cache
      },
    });

  } catch (error) {
    console.error('[Frame Image] Error generating frame image:', error);
    
    // Return a simple fallback image
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    
    // Use solid color background #073d5c (same as claim button)
    ctx.fillStyle = '#073d5c';
    ctx.fillRect(0, 0, 1200, 630);
    
    const buffer = canvas.toBuffer('image/png');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // No cache
      },
    });
  }
}