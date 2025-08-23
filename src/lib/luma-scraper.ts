export async function fetchEventIdFromShortUrl(shortUrl: string): Promise<string | null> {
  try {
    const response = await fetch('/api/luma/scrape-event-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: shortUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to scrape event ID');
    }

    const data = await response.json();
    return data.eventId || null;
  } catch (error) {
    console.error('Error fetching event ID:', error);
    return null;
  }
}