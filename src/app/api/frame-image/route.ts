import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
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
    // Get POAP event data
    let poapImageUrl = '';
    let poapName = 'POAP';
    
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
          poapName = eventData.name;
        }
      } catch (error) {
        console.error('[Frame Image] Error fetching POAP data:', error);
      }
    }

    // Create canvas
    const canvas = createCanvas(1200, 630); // Standard Open Graph size
    const ctx = canvas.getContext('2d');

    // Load background image
    const backgroundPath = path.join(process.cwd(), 'public', 'cast-background0.png');
    const background = await loadImage(backgroundPath);
    
    // Draw background
    ctx.drawImage(background, 0, 0, 1200, 630);

    // If we have a POAP image, load and draw it
    if (poapImageUrl) {
      try {
        const poapImage = await loadImage(poapImageUrl);
        
        // Draw POAP image in center, circular
        const poapSize = 200;
        const poapX = (1200 - poapSize) / 2;
        const poapY = (630 - poapSize) / 2 - 50; // Slightly above center
        
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
      }
    }

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    
    // Draw text below the POAP image
    const text = `Get your ${poapName}`;
    const textY = 630 / 2 + 150; // Below center
    ctx.fillText(text, 600, textY);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Return image response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('[Frame Image] Error generating frame image:', error);
    
    // Return a simple fallback image
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    
    // Simple fallback
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1200, 630);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Get your POAP', 600, 315);
    
    const buffer = canvas.toBuffer('image/png');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes on error
      },
    });
  }
}