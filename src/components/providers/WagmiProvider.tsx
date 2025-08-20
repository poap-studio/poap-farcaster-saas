import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import farcasterFrame from "@farcaster/frame-wagmi-connector";
import { AuthKitProvider } from "@farcaster/auth-kit";
// import { walletConnect } from "wagmi/connectors";

// const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(rpcUrl),
  },
  connectors: [
    farcasterFrame(),
    // walletConnect({ projectId, showQrModal: true }),
  ],
});

const queryClient = new QueryClient();

const authKitConfig = {
  rpcUrl: rpcUrl,
  domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  siweUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
};

export default function Provider({ children }: { children: React.ReactNode }) {
  try {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthKitProvider config={authKitConfig}>
            {children}
          </AuthKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  } catch (error) {
    console.error('Error initializing WagmiProvider:', error);
    return <div>Error loading providers. Check console for details.</div>;
  }
}
