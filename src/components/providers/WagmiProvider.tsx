import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import farcasterFrame from "@farcaster/frame-wagmi-connector";
// import { walletConnect } from "wagmi/connectors";

// const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.BASE_RPC_URL),
  },
  connectors: [
    farcasterFrame(),
    // walletConnect({ projectId, showQrModal: true }),
  ],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
