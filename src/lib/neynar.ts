const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "";
const REQUIRED_FOLLOW_USERNAME = process.env.NEXT_PUBLIC_REQUIRED_FOLLOW_USERNAME || "gotoalberto";

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

export function getRequiredFollowUsername(): string {
  return REQUIRED_FOLLOW_USERNAME;
}