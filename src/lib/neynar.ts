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
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${targetUsername}&viewer_fid=${viewerFid}`,
      {
        headers: {
          "api_key": NEYNAR_API_KEY,
          "accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      console.error("Neynar API error:", response.status, response.statusText);
      return false;
    }

    const data: NeynarFollowResponse = await response.json();
    return data.result?.viewer_context?.following || false;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}

export function getRequiredFollowUsername(): string {
  return REQUIRED_FOLLOW_USERNAME;
}