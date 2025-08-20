import { AuthKitProvider } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = {
    rpcUrl: "https://mainnet.optimism.io",
    domain: typeof window !== "undefined" ? window.location.host : "localhost:3000",
    siweUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  };

  return (
    <AuthKitProvider config={config}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        {children}
      </div>
    </AuthKitProvider>
  );
}