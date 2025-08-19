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
    // Register fonts before creating canvas
    try {
      const fontPathRegular = path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf');
      const fontPathBold = path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf');
      
      console.log('[Frame Image] Registering fonts from:', fontPathRegular, fontPathBold);
      
      registerFont(fontPathRegular, { family: 'Inter' });
      registerFont(fontPathBold, { family: 'Inter', weight: 'bold' });
      
      console.log('[Frame Image] Fonts registered successfully');
    } catch (fontError) {
      console.error('[Frame Image] Error registering fonts:', fontError);
    }
    
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

    // Draw text with registered font
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Try different font syntaxes
    try {
      // First try with Inter font
      ctx.font = '48px Inter';
      console.log('[Frame Image] Font set to:', ctx.font);
      ctx.fillText('Get your', 600, 260);
      
      ctx.font = 'bold 64px Inter';
      console.log('[Frame Image] Font set to:', ctx.font);
      ctx.fillText('Arbitrum POAP', 600, 340);
    } catch (textError) {
      console.error('[Frame Image] Error drawing text with Inter font:', textError);
      
      // Fallback to system font
      ctx.font = '48px sans-serif';
      ctx.fillText('Get your', 600, 260);
      
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('Arbitrum POAP', 600, 340);
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
      
      // Draw POAP image left of center, circular
      const poapSize = 280;
      const poapX = (1200 - poapSize) / 2 - 210; // Moved 210px to the left
      const poapY = (630 - poapSize) / 2; // Vertically centered
      
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
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes on error
      },
    });
  }
}