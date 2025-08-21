"use client";

import dynamic from "next/dynamic";
import { GoogleOAuthProvider } from "@react-oauth/google";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  console.log('Google Client ID configured:', !!googleClientId);
  
  if (!googleClientId) {
    console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
    return <WagmiProvider>{children}</WagmiProvider>;
  }
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <WagmiProvider>{children}</WagmiProvider>
    </GoogleOAuthProvider>
  );
}
