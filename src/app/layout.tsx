import type { Metadata } from "next";

import "~/app/globals.css";
import "@farcaster/auth-kit/styles.css";
import { Providers } from "~/app/providers";

export const metadata: Metadata = {
  title: 'Social POAPs - Drop POAPs on Farcaster',
  description: 'Distribute POAPs through Farcaster frames and collect valuable audience data. Turn your social engagement into Web3 connections with gas-free collectibles.',
  keywords: 'POAP, Farcaster, Web3, NFT, Social Media, Ethereum, Collectibles, Frames',
  authors: [{ name: 'POAP Studio' }],
  creator: 'POAP Studio',
  publisher: 'POAP Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://social.poap.studio'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Social POAPs - Drop POAPs on Farcaster',
    description: 'Distribute POAPs through Farcaster frames and collect valuable audience data. Turn your social engagement into Web3 connections.',
    url: 'https://social.poap.studio',
    siteName: 'Social POAPs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Social POAPs - Drop POAPs on Farcaster',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social POAPs - Drop POAPs on Farcaster',
    description: 'Distribute POAPs through Farcaster frames. Turn social engagement into Web3 connections.',
    creator: '@poap_xyz',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎁</text></svg>',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎁</text></svg>',
        type: 'image/svg+xml',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
