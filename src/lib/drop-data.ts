// Helper functions to get drop data in client components
export interface Drop {
  id: string;
  slug: string;
  poapEventId: string;
  poapSecretCode: string;
  buttonColor: string;
  backgroundColor: string;
  logoUrl?: string;
  mintMessage: string;
  disclaimerMessage: string;
  requireFollow: boolean;
  followUsername?: string;
  requireRecast: boolean;
}

export function getCurrentDrop(): Drop | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from window first (set by DropContent)
  const windowData = (window as Window & { __DROP_DATA__?: Drop }).__DROP_DATA__;
  if (windowData) return windowData;
  
  // Fallback to localStorage
  const stored = localStorage.getItem('currentDrop');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing drop data from localStorage:', e);
    }
  }
  
  return null;
}

export function getDropConfig() {
  const drop = getCurrentDrop();
  if (!drop) {
    // Return default values
    return {
      buttonColor: '#0a5580',
      backgroundColor: '#073d5c',
      logoUrl: undefined,
      mintMessage: 'Enter your wallet address or ENS name to claim your commemorative POAP token.',
      disclaimerMessage: 'By minting this POAP you accept these terms: https://poap.xyz/terms',
      requireFollow: true,
      followUsername: null,
      requireRecast: true
    };
  }
  
  return {
    buttonColor: drop.buttonColor,
    backgroundColor: drop.backgroundColor,
    logoUrl: drop.logoUrl,
    mintMessage: drop.mintMessage,
    disclaimerMessage: drop.disclaimerMessage,
    requireFollow: drop.requireFollow,
    followUsername: drop.followUsername,
    requireRecast: drop.requireRecast
  };
}