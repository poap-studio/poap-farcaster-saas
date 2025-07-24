import { createPublicClient, http, isAddress } from 'viem';
import { mainnet } from 'viem/chains';

// Create a public client for ENS resolution on mainnet
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

/**
 * Check if a string is a valid ENS name
 */
export function isENSName(input: string): boolean {
  if (!input) return false;
  
  // ENS names end with .eth or other TLD and contain at least one dot
  return input.includes('.') && 
         input.length > 4 && 
         !isAddress(input) && 
         /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input);
}

/**
 * Resolve ENS name to Ethereum address
 */
export async function resolveENS(ensName: string): Promise<string | null> {
  try {
    if (!isENSName(ensName)) {
      return null;
    }

    console.log(`[ENS] Resolving ENS name: ${ensName}`);
    
    const address = await publicClient.getEnsAddress({
      name: ensName,
    });

    if (address) {
      console.log(`[ENS] Resolved ${ensName} to ${address}`);
      return address;
    }

    console.log(`[ENS] No address found for ${ensName}`);
    return null;
  } catch (error) {
    console.error(`[ENS] Error resolving ${ensName}:`, error);
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