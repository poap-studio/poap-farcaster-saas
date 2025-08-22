export class LumaCookieManager {
  private static instance: LumaCookieManager;
  private cookie: string | null = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = new LumaCookieManager();
    }
    return this.instance;
  }

  getCookie(): string {
    // First try environment variable
    const envCookie = process.env.LUMA_SESSION_COOKIE;
    if (envCookie) {
      return envCookie;
    }

    // Fallback to stored cookie
    return this.cookie || '';
  }

  setCookie(cookie: string) {
    this.cookie = cookie;
  }

  async validateCookie(): Promise<boolean> {
    const cookie = this.getCookie();
    if (!cookie) return false;

    try {
      // Test with a known event
      const response = await fetch(
        'https://api.lu.ma/event/admin/get?event_api_id=evt-dFABGoCDVLecXHG',
        {
          headers: {
            'Cookie': cookie,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        }
      );
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

export interface LumaEvent {
  event: {
    api_id: string;
    name: string;
    start_at: string;
    end_at: string;
    url: string;
    location_display_name?: string;
  };
  hosts: Array<{
    name: string;
    email: string;
  }>;
  guests_count: number;
}

export interface LumaGuest {
  api_id: string;
  name: string;
  email: string;
  checked_in_at: string | null;
  registered_at: string;
}

export async function fetchLumaEvent(eventId: string): Promise<LumaEvent> {
  const manager = LumaCookieManager.getInstance();
  const cookie = manager.getCookie();

  if (!cookie) {
    throw new Error('No Luma cookie available. Please contact admin.');
  }

  const response = await fetch(
    `https://api.lu.ma/event/admin/get?event_api_id=${eventId}`,
    {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }
  );

  if (response.status === 403) {
    throw new Error('You must be the owner or co-host of this event');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch event data');
  }

  return response.json();
}

export async function fetchLumaGuests(eventId: string): Promise<LumaGuest[]> {
  const manager = LumaCookieManager.getInstance();
  const cookie = manager.getCookie();

  if (!cookie) {
    throw new Error('No Luma cookie available. Please contact admin.');
  }

  const allGuests: LumaGuest[] = [];
  let cursor: string | null = null;

  do {
    const url = new URL('https://api.lu.ma/event/admin/get-guests');
    url.searchParams.set('event_api_id', eventId);
    if (cursor) {
      url.searchParams.set('pagination_cursor', cursor);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch guest list');
    }

    const data = await response.json();
    allGuests.push(...data.entries);
    
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return allGuests;
}