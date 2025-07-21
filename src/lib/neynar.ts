const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "";
const REQUIRED_FOLLOW_USERNAME = process.env.NEXT_PUBLIC_REQUIRED_FOLLOW_USERNAME || "gotoalberto";

interface NeynarFollowResponse {
  result: {
    user: {
      fid: number;
      username: string;
    };
    viewer_context: {
      following: boolean;
    };
  };
}

export async function checkIfUserFollows(
  viewerFid: number,
  targetUsername: string = REQUIRED_FOLLOW_USERNAME
): Promise<boolean> {
  console.log(`[Follow Check] Starting check for viewer FID: ${viewerFid}, target username: ${targetUsername}`);
  
  if (!NEYNAR_API_KEY) {
    console.error("[Follow Check] NEYNAR_API_KEY is not set");
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
      return false;
    }

    const data: NeynarFollowResponse = await response.json();
    console.log("[Follow Check] API response:", JSON.stringify(data, null, 2));
    
    const isFollowing = data.result?.viewer_context?.following || false;
    console.log(`[Follow Check] Follow status result: ${isFollowing}`);
    
    return isFollowing;
  } catch (error) {
    console.error("[Follow Check] Error checking follow status:", error);
    return false;
  }
}

export function getRequiredFollowUsername(): string {
  return REQUIRED_FOLLOW_USERNAME;
}