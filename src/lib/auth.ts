export const FARCASTER_AUTH_CONFIG = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: "https://mainnet.optimism.io",
  siweUri: process.env.NEXT_PUBLIC_FRAME_URL || "https://poap-farcaster-saas.vercel.app",
  domain: typeof window !== 'undefined' 
    ? window.location.hostname 
    : new URL(process.env.NEXT_PUBLIC_FRAME_URL || "https://poap-farcaster-saas.vercel.app").hostname,
};