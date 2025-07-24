/**
 * Spam validation utility for checking if a Farcaster ID is marked as spam
 * Based on https://github.com/merkle-team/labels/raw/refs/heads/main/spam.jsonl
 */

export interface SpamEntry {
  fid: number;
  label_value: number;
}

/**
 * Check if a Farcaster ID is marked as spam
 * @param fid - The Farcaster ID to check
 * @returns Promise<boolean> - true if the FID is marked as spam (label_value = 2)
 */
export async function isSpamUser(fid: number): Promise<boolean> {
  try {
    console.log(`[SpamValidation] Checking FID ${fid} for spam status...`);
    
    const response = await fetch('https://github.com/merkle-team/labels/raw/refs/heads/main/spam.jsonl');
    
    if (!response.ok) {
      console.error(`[SpamValidation] Failed to fetch spam data: ${response.status}`);
      // If we can't fetch the spam data, allow the user to proceed (fail-open)
      return false;
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const entry: SpamEntry = JSON.parse(line);
        
        // Check if this FID exists and has label_value of 2 (spam)
        if (entry.fid === fid && entry.label_value === 2) {
          console.log(`[SpamValidation] FID ${fid} is marked as spam`);
          return true;
        }
      } catch {
        // Skip malformed lines
        console.warn(`[SpamValidation] Skipping malformed line:`, line);
        continue;
      }
    }
    
    console.log(`[SpamValidation] FID ${fid} is not marked as spam`);
    return false;
  } catch (error) {
    console.error(`[SpamValidation] Error checking spam status for FID ${fid}:`, error);
    // If there's an error, allow the user to proceed (fail-open)
    return false;
  }
}