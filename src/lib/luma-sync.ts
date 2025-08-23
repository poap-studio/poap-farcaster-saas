import { prisma } from "~/lib/prisma";
import { fetchLumaGuests } from "~/lib/luma-cookie";

interface LumaGuestData {
  api_id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  registered_at: string;
  checked_in_at: string | null;
  eth_address?: string | null;
  solana_address?: string | null;
  phone_number?: string | null;
  geo_city?: string | null;
  geo_country?: string | null;
  avatar_url?: string | null;
  twitter_handle?: string | null;
  instagram_handle?: string | null;
  linkedin_handle?: string | null;
  website?: string | null;
  approval_status?: string;
}

export async function syncLumaGuests(dropId: string, lumaEventId: string) {
  try {
    // Fetch all guests from Luma (handles pagination internally)
    const guests = await fetchLumaGuests(lumaEventId) as unknown as LumaGuestData[];
    
    // Bulk upsert guests
    for (const guest of guests) {
      await prisma.lumaGuest.upsert({
        where: {
          dropId_guestId: {
            dropId,
            guestId: guest.api_id
          }
        },
        update: {
          email: guest.email,
          name: guest.name,
          firstName: guest.first_name || null,
          lastName: guest.last_name || null,
          registeredAt: new Date(guest.registered_at),
          checkedInAt: guest.checked_in_at ? new Date(guest.checked_in_at) : null,
          ethAddress: guest.eth_address || null,
          solanaAddress: guest.solana_address || null,
          phoneNumber: guest.phone_number || null,
          geoCity: guest.geo_city || null,
          geoCountry: guest.geo_country || null,
          avatarUrl: guest.avatar_url || null,
          twitterHandle: guest.twitter_handle || null,
          instagramHandle: guest.instagram_handle || null,
          linkedinHandle: guest.linkedin_handle || null,
          website: guest.website || null,
          approvalStatus: guest.approval_status || null,
          lastSyncedAt: new Date()
        },
        create: {
          dropId,
          guestId: guest.api_id,
          email: guest.email,
          name: guest.name,
          firstName: guest.first_name || null,
          lastName: guest.last_name || null,
          registeredAt: new Date(guest.registered_at),
          checkedInAt: guest.checked_in_at ? new Date(guest.checked_in_at) : null,
          ethAddress: guest.eth_address || null,
          solanaAddress: guest.solana_address || null,
          phoneNumber: guest.phone_number || null,
          geoCity: guest.geo_city || null,
          geoCountry: guest.geo_country || null,
          avatarUrl: guest.avatar_url || null,
          twitterHandle: guest.twitter_handle || null,
          instagramHandle: guest.instagram_handle || null,
          linkedinHandle: guest.linkedin_handle || null,
          website: guest.website || null,
          approvalStatus: guest.approval_status || null
        }
      });
    }

    return {
      success: true,
      totalGuests: guests.length,
      checkedIn: guests.filter(g => g.checked_in_at !== null).length
    };
  } catch (error) {
    console.error("Error syncing Luma guests:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}