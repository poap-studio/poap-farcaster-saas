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

export async function checkIfUserRecasted(userFid: number, castHash?: string): Promise<boolean> {
  console.log(`[Recast Check] Checking recast for FID: ${userFid}, hash: ${castHash}`);
  
  const hashToCheck = castHash || REQUIRED_RECAST_HASH;
  
  if (!hashToCheck) {
    console.error("[Recast Check] No cast hash provided");
    return false;
  }
  
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
    console.log(`[Recast Check] Recast status result: ${hasRecasted}`);
    
    return hasRecasted;
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