import { createPublicClient, http, isAddress } from 'viem';
import { mainnet } from 'viem/chains';

// Create a public client for ENS resolution on mainnet
// Using a reliable RPC endpoint
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://1rpc.io/eth')
});

/**
 * Check if a string is a valid ENS name
 */
export function isENSName(input: string): boolean {
  if (!input) return false;
  
  // Don't process if it's already a valid Ethereum address
  if (isAddress(input)) return false;
  
  // ENS names should end with .eth (most common) or other valid TLDs
  // Allow letters, numbers, hyphens and dots, but be more permissive
  return input.includes('.') && 
         input.length > 3 && 
         /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-z]{2,}$/i.test(input);
}

/**
 * Resolve ENS name to Ethereum address
 */
export async function resolveENS(ensName: string): Promise<string | null> {
  try {
    if (!isENSName(ensName)) {
      console.log(`[ENS] ${ensName} is not a valid ENS name format`);
      return null;
    }

    console.log(`[ENS] Resolving ENS name: ${ensName}`);
    
    const address = await publicClient.getEnsAddress({
      name: ensName.toLowerCase(), // ENS names are case-insensitive
    });

    if (address && address !== '0x0000000000000000000000000000000000000000') {
      console.log(`[ENS] Successfully resolved ${ensName} to ${address}`);
      return address;
    }

    console.log(`[ENS] No address found for ${ensName} (returned ${address})`);
    return null;
  } catch (error) {
    console.error(`[ENS] Error resolving ${ensName}:`, error);
    
    // Log the specific error type for debugging
    if (error instanceof Error) {
      console.error(`[ENS] Error details: ${error.message}`);
      
      // Check for specific error types that indicate the ENS name doesn't exist
      if (error.message.includes('Internal error') || 
          error.message.includes('ResolverNotFound') ||
          error.message.includes('resolver not found')) {
        console.log(`[ENS] ${ensName} appears to not exist or have no resolver`);
        return null;
      }
    }
    
    // For other errors (network issues, etc.), return null but it might be worth retrying
    return null;
  }
}

/**
 * Resolve address or ENS name to a valid Ethereum address
 * Returns the original address if it's already valid, or resolves ENS if it's an ENS name
 */
export async function resolveAddressOrENS(input: string): Promise<{
  address: string | null;
  isENS: boolean;
  original: string;
}> {
  const trimmedInput = input.trim();
  
  // If it's already a valid Ethereum address, return it
  if (isAddress(trimmedInput)) {
    return {
      address: trimmedInput,
      isENS: false,
      original: trimmedInput
    };
  }
  
  // If it looks like an ENS name, try to resolve it
  if (isENSName(trimmedInput)) {
    const resolvedAddress = await resolveENS(trimmedInput);
    return {
      address: resolvedAddress,
      isENS: true,
      original: trimmedInput
    };
  }
  
  // Not a valid address or ENS name
  return {
    address: null,
    isENS: false,
    original: trimmedInput
  };
}