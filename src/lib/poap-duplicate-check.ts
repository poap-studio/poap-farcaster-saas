import { getPOAPAuthManager } from './poap-auth';

interface POAPOwnershipCheck {
  hasPoap: boolean;
  tokenId?: string;
  owner?: string;
  error?: string;
}

/**
 * Check if an address, ENS, or email already owns a POAP for a given event
 * @param recipient - Can be an Ethereum address, ENS name, or email
 * @param eventId - The POAP event ID
 * @returns Object indicating if the recipient already owns this POAP
 */
export async function checkPOAPOwnership(
  recipient: string,
  eventId: string
): Promise<POAPOwnershipCheck> {
  try {
    const authManager = getPOAPAuthManager();
    const apiKey = process.env.POAP_API_KEY;
    
    if (!apiKey) {
      throw new Error('POAP API key not configured');
    }

    // Encode the recipient to handle special characters in emails
    const encodedRecipient = encodeURIComponent(recipient);
    const url = `https://api.poap.tech/actions/scan/${encodedRecipient}/${eventId}`;
    
    console.log(`[POAP Duplicate Check] Checking ownership for ${recipient} on event ${eventId}`);
    
    const response = await authManager.makeAuthenticatedRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (response.status === 404) {
      // User does not have this POAP
      console.log(`[POAP Duplicate Check] ${recipient} does not own POAP for event ${eventId}`);
      return {
        hasPoap: false,
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[POAP Duplicate Check] Error checking ownership: ${response.status} - ${errorText}`);
      throw new Error(`Failed to check POAP ownership: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[POAP Duplicate Check] ${recipient} already owns POAP for event ${eventId}. TokenId: ${data.tokenId}`);
    
    return {
      hasPoap: true,
      tokenId: data.tokenId,
      owner: data.owner,
    };
  } catch (error) {
    console.error('[POAP Duplicate Check] Error:', error);
    return {
      hasPoap: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}