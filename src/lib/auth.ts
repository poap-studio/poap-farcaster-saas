import { SignInButton } from "@farcaster/auth-kit";

export const FARCASTER_AUTH_CONFIG = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: "https://mainnet.optimism.io",
  siweUri: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  domain: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000").host,
};