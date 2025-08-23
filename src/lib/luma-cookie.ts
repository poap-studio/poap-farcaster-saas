import { prisma } from "~/lib/prisma";

export class LumaCookieManager {
  private static instance: LumaCookieManager;
  private cookie: string | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance() {
    if (!this.instance) {
      this.instance = new LumaCookieManager();
    }
    return this.instance;
  }

  async getCookie(): Promise<string> {
    // First try environment variable
    const envCookie = process.env.LUMA_SESSION_COOKIE;
    if (envCookie) {
      return envCookie;
    }

    // Check if we have a cached cookie that's still fresh
    if (this.cookie && this.lastFetch) {
      const age = Date.now() - this.lastFetch.getTime();
      if (age < this.CACHE_DURATION) {
        return this.cookie;
      }
    }

    // Fetch from database
    try {
      const latestCookie = await prisma.lumaCookie.findFirst({
        where: {
          isValid: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      if (latestCookie) {
        this.cookie = latestCookie.cookie;
        this.lastFetch = new Date();
        return latestCookie.cookie;
      }
    } catch (error) {
      console.error('Failed to fetch cookie from database:', error);
    }

    // Fallback to memory cookie
    return this.cookie || '';
  }

  async setCookie(cookie: string, expiresAt?: Date) {
    this.cookie = cookie;
    this.lastFetch = new Date();

    try {
      // Invalidate old cookies
      await prisma.lumaCookie.updateMany({
        where: { isValid: true },
        data: { isValid: false }
      });

      // Save new cookie
      await prisma.lumaCookie.create({
        data: {
          cookie,
          expiresAt,
          isValid: true
        }
      });
    } catch (error) {
      console.error('Failed to save cookie to database:', error);
    }
  }

  async validateCookie(): Promise<boolean> {
    const cookie = await this.getCookie();
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
      
      const isValid = response.ok;
      
      // Update validity in database if changed
      if (!isValid && this.cookie === cookie) {
        await prisma.lumaCookie.updateMany({
          where: { cookie, isValid: true },
          data: { isValid: false }
        });
      }
      
      return isValid;
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
    host_info: {
      email: string;
      created_at: string;
      user_api_id: string;
      is_manager: boolean;
      is_creator: boolean;
      access_level: string;
      is_visible: boolean;
      position?: string;
    };
    user: {
      api_id: string;
      name: string;
      username?: string;
      avatar_url?: string;
      bio_short?: string;
    };
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
  const cookie = await manager.getCookie();

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
  const cookie = await manager.getCookie();

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
    console.log(`Luma API response for ${eventId}:`, {
      entriesCount: data.entries?.length || 0,
      hasMore: data.has_more,
      nextCursor: data.next_cursor
    });
    
    if (data.entries && data.entries.length > 0) {
      allGuests.push(...data.entries);
    }
    
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return allGuests;
}