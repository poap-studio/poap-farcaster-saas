import { NextResponse } from "next/server";
import { getSession } from "~/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch page" }, { status: response.status });
    }

    const html = await response.text();
    
    // Method 1: Look for Next.js data (most reliable)
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const eventId = nextData?.props?.pageProps?.initialData?.data?.api_id;
        if (eventId && eventId.startsWith('evt-')) {
          return NextResponse.json({ eventId });
        }
      } catch (e) {
        console.error('Failed to parse Next.js data:', e);
      }
    }
    
    // Method 2: Look for event ID pattern in the HTML
    const eventIdPattern = /evt-[a-zA-Z0-9]+/;
    const match = html.match(eventIdPattern);
    if (match) {
      return NextResponse.json({ eventId: match[0] });
    }
    
    return NextResponse.json({ error: "Event ID not found" }, { status: 404 });
  } catch (error) {
    console.error("Error scraping Luma event ID:", error);
    return NextResponse.json(
      { error: "Failed to scrape event ID" },
      { status: 500 }
    );
  }
}