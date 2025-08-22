const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "";
const REQUIRED_FOLLOW_USERNAME = process.env.NEXT_PUBLIC_REQUIRED_FOLLOW_USERNAME || "gotoalberto";
const REQUIRED_RECAST_HASH = process.env.NEXT_PUBLIC_REQUIRED_RECAST_HASH || "";

interface NeynarFollowResponse {
  user: {
    fid: number;
    username: string;
    viewer_context?: {
      following: boolean;
    };
  };
}


export async function checkIfUserFollows(
  viewerFid: number,
  targetUsername: string = REQUIRED_FOLLOW_USERNAME
): Promise<boolean> {
  console.log(`[Follow Check] Starting check for viewer FID: ${viewerFid}, target username: ${targetUsername}`);
  
  // Development mode override - bypass follow check for development
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FOLLOW === 'true') {
    console.log("[Follow Check] DEV MODE: Bypassing follow check (simulating follow)");
    return true;
  }
  
  if (!NEYNAR_API_KEY) {
    console.error("[Follow Check] NEYNAR_API_KEY is not set:", NEYNAR_API_KEY);
    return false;
  }

  if (!viewerFid) {
    console.error("[Follow Check] viewerFid is required");
    return false;
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/user/by_username?username=${targetUsername}&viewer_fid=${viewerFid}`;
    console.log(`[Follow Check] Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Follow Check] Neynar API error: ${response.status} ${response.statusText}`, errorText);
      
      // If API fails, let's check if it's a 401 (unauthorized) or 404 (not found)
      if (response.status === 401) {
        console.error("[Follow Check] Unauthorized - check your NEYNAR_API_KEY");
      } else if (response.status === 404) {
        console.error(`[Follow Check] User '${targetUsername}' not found`);
      }
      
      return false;
    }

    const data: NeynarFollowResponse = await response.json();
    console.log("[Follow Check] API response:", JSON.stringify(data, null, 2));
    
    const isFollowing = data.user?.viewer_context?.following || false;
    console.log(`[Follow Check] Follow status result: ${isFollowing}`);
    
    return isFollowing;
  } catch (error) {
    console.error("[Follow Check] Error checking follow status:", error);
    return false;
  }
}

// Diagnostic function to verify API connectivity and response structure
export async function verifyNeynarAPI(targetUsername: string = REQUIRED_FOLLOW_USERNAME): Promise<void> {
  console.log("[Neynar API] Verifying API connectivity for username:", targetUsername);
  console.log("[Neynar API] API Key status:", NEYNAR_API_KEY ? "Present" : "Missing");
  
  if (!NEYNAR_API_KEY) {
    console.error("[Neynar API] API key is missing");
    return;
  }

  try {
    const baseUrl = `https://api.neynar.com/v2/farcaster/user/by_username?username=${targetUsername}`;
    console.log("[Neynar API] Making diagnostic API call:", baseUrl);
    
    const response = await fetch(baseUrl, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    console.log("[Neynar API] Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Neynar API] API Error:", response.status, response.statusText, errorText);
      return;
    }

    const data = await response.json();
    console.log("[Neynar API] Response structure:", JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("[Neynar API] Connection error:", error);
  }
}

export async function getUserEthAddress(userFid: number): Promise<string | null> {
  console.log(`[User Address] Getting ETH address for FID: ${userFid}`);
  
  if (!NEYNAR_API_KEY) {
    console.error("[User Address] NEYNAR_API_KEY is not set");
    return null;
  }

  if (!userFid) {
    console.error("[User Address] userFid is required");
    return null;
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${userFid}`;
    console.log(`[User Address] Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[User Address] Neynar API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    console.log("[User Address] API response:", JSON.stringify(data, null, 2));
    
    const user = data.users?.[0];
    if (!user) {
      console.error("[User Address] No user data found");
      return null;
    }

    // Try to get the primary ETH address first, then fall back to the first available address
    const primaryAddress = user.verified_addresses?.primary?.eth_address;
    const firstAddress = user.verified_addresses?.eth_addresses?.[0];
    
    const ethAddress = primaryAddress || firstAddress;
    console.log(`[User Address] Found ETH address: ${ethAddress}`);
    
    return ethAddress || null;
  } catch (error) {
    console.error("[User Address] Error getting user ETH address:", error);
    return null;
  }
}

export async function checkIfUserRecasted(userFid: number, castHash?: string): Promise<boolean | { recasted: boolean; author: string | null }> {
  console.log(`[Recast Check] Checking recast for FID: ${userFid}, hash: ${castHash}`);
  
  const hashToCheck = castHash || REQUIRED_RECAST_HASH;
  
  if (!hashToCheck) {
    console.error("[Recast Check] No cast hash provided. Either pass a hash or set NEXT_PUBLIC_REQUIRED_RECAST_HASH");
    return false;
  }
  
  console.log(`[Recast Check] Using cast hash: ${hashToCheck}`);
  
  if (!NEYNAR_API_KEY) {
    console.error("[Recast Check] NEYNAR_API_KEY is not set");
    return false;
  }

  if (!userFid) {
    console.error("[Recast Check] userFid is required");
    return false;
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/cast?identifier=${hashToCheck}&type=hash&viewer_fid=${userFid}`;
    console.log(`[Recast Check] Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Recast Check] Neynar API error: ${response.status} ${response.statusText}`, errorText);
      return false;
    }

    const data = await response.json();
    console.log("[Recast Check] API response:", JSON.stringify(data, null, 2));
    
    const hasRecasted = data.cast?.viewer_context?.recasted || false;
    const author = data.cast?.author?.username || null;
    console.log(`[Recast Check] Recast status result: ${hasRecasted}, author: ${author}`);
    
    return { recasted: hasRecasted, author };
  } catch (error) {
    console.error("[Recast Check] Error checking recast status:", error);
    return false;
  }
}

export function getRequiredFollowUsername(): string {
  return REQUIRED_FOLLOW_USERNAME;
}

export function getRequiredRecastHash(): string {
  return REQUIRED_RECAST_HASH;
}

export async function getUserUsername(userFid: number): Promise<string | null> {
  console.log(`[User Username] Getting username for FID: ${userFid}`);
  
  if (!NEYNAR_API_KEY) {
    console.error("[User Username] NEYNAR_API_KEY is not set");
    return null;
  }

  if (!userFid) {
    console.error("[User Username] userFid is required");
    return null;
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${userFid}`;
    console.log(`[User Username] Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      console.error("[User Username] API response not OK:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log("[User Username] API response:", JSON.stringify(data, null, 2));
    
    const user = data.users?.[0];
    if (!user) {
      console.error("[User Username] No user data found");
      return null;
    }

    const username = user.username;
    console.log(`[User Username] Found username: ${username}`);
    
    return username || null;
  } catch (error) {
    console.error("[User Username] Error getting username:", error);
    return null;
  }
}

export async function checkIfUserQuoted(userFid: number, castHash?: string): Promise<boolean> {
  console.log(`[Quote Check] Checking quote for FID: ${userFid}, hash: ${castHash}`);
  
  const hashToCheck = castHash || REQUIRED_RECAST_HASH;
  
  if (!hashToCheck) {
    console.error("[Quote Check] No cast hash provided");
    return false;
  }
  
  console.log(`[Quote Check] Using cast hash: ${hashToCheck}`);
  
  if (!NEYNAR_API_KEY) {
    console.error("[Quote Check] NEYNAR_API_KEY is not set");
    return false;
  }

  if (!userFid) {
    console.error("[Quote Check] userFid is required");
    return false;
  }

  try {
    // First, let's try to get the user's recent casts to check for quotes
    const userCastsUrl = `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${userFid}&limit=100`;
    console.log(`[Quote Check] Fetching user's recent casts from: ${userCastsUrl}`);
    
    const userCastsResponse = await fetch(userCastsUrl, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!userCastsResponse.ok) {
      const errorText = await userCastsResponse.text();
      console.error(`[Quote Check] Error fetching user casts: ${userCastsResponse.status}`, errorText);
      return false;
    }

    const userCastsData = await userCastsResponse.json();
    console.log(`[Quote Check] Found ${userCastsData.casts?.length || 0} recent casts from user`);
    
    // Check if any of the user's casts have the original cast embedded (which indicates a quote)
    let hasQuoted = false;
    
    if (userCastsData.casts) {
      for (const cast of userCastsData.casts) {
        // Check if this cast has embeds
        if (cast.embeds && Array.isArray(cast.embeds)) {
          // Look for an embed that references our cast
          for (const embed of cast.embeds) {
            // Check if the embed is a cast embed with our hash
            if (embed.cast_id && embed.cast_id.hash === hashToCheck) {
              console.log(`[Quote Check] Found quote in cast ${cast.hash} with cast_id embed`);
              hasQuoted = true;
              break;
            }
            // Also check for cast object embed
            if (embed.cast && embed.cast.hash === hashToCheck) {
              console.log(`[Quote Check] Found quote in cast ${cast.hash} with cast embed`);
              hasQuoted = true;
              break;
            }
            // Check URL embeds that might reference the cast
            if (embed.url) {
              // Check if URL contains the hash or a Warpcast URL with the hash
              if (embed.url.includes(hashToCheck) || 
                  (embed.url.includes('warpcast.com') && embed.url.includes(hashToCheck.substring(0, 10)))) {
                console.log(`[Quote Check] Found quote reference in URL embed: ${embed.url}`);
                hasQuoted = true;
                break;
              }
            }
          }
          if (hasQuoted) break;
        }
      }
    }
    
    // If not found in recent casts, also try the quotes endpoint as a fallback
    if (!hasQuoted) {
      console.log("[Quote Check] Not found in recent casts, trying quotes endpoint...");
      
      const quotesUrl = `https://api.neynar.com/v2/farcaster/cast/quotes?hash=${hashToCheck}&limit=100`;
      const quotesResponse = await fetch(quotesUrl, {
        headers: {
          "api_key": NEYNAR_API_KEY,
          "accept": "application/json"
        }
      });

      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        hasQuoted = quotesData.casts?.some((cast: { author: { fid: number } }) => cast.author.fid === userFid) || false;
        if (hasQuoted) {
          console.log(`[Quote Check] Found quote in quotes endpoint`);
        }
      }
    }
    
    console.log(`[Quote Check] Final quote status: ${hasQuoted}`);
    return hasQuoted;
  } catch (error) {
    console.error("[Quote Check] Error checking quote status:", error);
    return false;
  }
}

export async function getUserProfile(userFid: number): Promise<{ username: string | null; followers: number | null }> {
  console.log(`[User Profile] Getting profile for FID: ${userFid}`);
  
  if (!NEYNAR_API_KEY) {
    console.error("[User Profile] NEYNAR_API_KEY is not set");
    return { username: null, followers: null };
  }

  if (!userFid) {
    console.error("[User Profile] userFid is required");
    return { username: null, followers: null };
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${userFid}`;
    console.log(`[User Profile] Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      console.error("[User Profile] API response not OK:", response.status, response.statusText);
      return { username: null, followers: null };
    }

    const data = await response.json();
    console.log("[User Profile] API response:", JSON.stringify(data, null, 2));
    
    const user = data.users?.[0];
    if (!user) {
      console.error("[User Profile] No user data found");
      return { username: null, followers: null };
    }

    const username = user.username || null;
    const followers = user.follower_count || 0;
    
    console.log(`[User Profile] Found username: ${username}, followers: ${followers}`);
    
    return { username, followers };
  } catch (error) {
    console.error("[User Profile] Error getting user profile:", error);
    return { username: null, followers: null };
  }
}