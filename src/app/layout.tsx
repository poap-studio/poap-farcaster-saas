import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";

// Function to get POAP event data - fallback to static for now
async function getPoapEventData() {
  // For static generation, we'll return a default that gets updated client-side
  return 'POAP';
}


const FRAME_URL = process.env.NEXT_PUBLIC_FRAME_URL 
  || (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : '');

export async function generateMetadata(): Promise<Metadata> {
  const poapName = await getPoapEventData();
  const title = `Mint ${poapName}`;
  
  const frame = {
    version: "next",
    imageUrl: `${FRAME_URL}/api/frame-image`,
    button: {
      title: title,
      action: {
        type: "launch_frame",
        name: title,
        url: FRAME_URL,
        splashImageUrl: `${FRAME_URL}/logo.svg`,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: title,
    description: title,
    openGraph: {
      title: title,
      description: title,
      images: [{
        url: `${FRAME_URL}/api/frame-image`,
        alt: title
      }]
    },
    icons: {
      icon: [
        {
          url: 'data:image/svg+xml,<svg viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="Group 8"><path id="Vector" d="M3.03857 16.4329V23.4185C3.03857 23.8485 3.40252 24.0271 3.51575 24.0676C3.62897 24.1163 4.00909 24.2218 4.34876 23.9053L9.63345 18.8268C10.0835 18.3944 10.5178 17.9398 10.8442 17.4079C10.9979 17.1579 11.0616 17.017 11.0616 17.017C11.3851 16.3598 11.3851 15.727 11.0695 15.0941C10.6007 14.153 9.40357 13.1956 7.59996 12.2869L4.51862 14.0069C3.60473 14.5262 3.03857 15.443 3.03857 16.4329Z" fill="%23CACFD8"/><g id="Group"><path id="Vector_2" d="M0 0.895782V8.22224C0 9.13906 0.614673 9.95039 1.48815 10.21C4.4644 11.07 9.64857 12.9199 10.9022 15.6379C11.0638 15.9949 11.1609 16.3438 11.1935 16.7089C12.0265 15.1917 12.4065 13.4473 12.2286 11.6785C11.9859 9.1715 10.6595 6.89161 8.58913 5.43931L1.20508 0.271044C1.07566 0.173682 0.921996 0.125 0.768335 0.125C0.638918 0.125 0.525693 0.149341 0.404386 0.214249C0.161743 0.352178 0 0.603699 0 0.895782Z" fill="white"/></g><path id="Vector_3" d="M22.6943 16.4329V23.4185C22.6943 23.8485 22.3305 24.0271 22.2172 24.0676C22.1041 24.1163 21.7237 24.2218 21.3842 23.9053L15.9765 18.7087C15.6084 18.3549 15.2568 17.9807 14.9796 17.5519C14.76 17.2126 14.6714 17.017 14.6714 17.017C14.3479 16.3598 14.3479 15.727 14.6632 15.0941C15.1323 14.153 16.3294 13.1956 18.1327 12.2869L21.2143 14.0069C22.1363 14.5262 22.6943 15.443 22.6943 16.4329Z" fill="%23CACFD8"/><g id="Group_2"><path id="Vector_4" d="M25.738 0.895049V8.22149C25.738 9.13831 25.1231 9.94965 24.2496 10.2093C21.2735 11.0693 16.0893 12.9192 14.8357 15.6372C14.6738 15.9942 14.5767 16.3431 14.5445 16.7082C13.7115 15.191 13.3314 13.4466 13.5093 11.6778C13.7517 9.17075 15.0782 6.8909 17.1488 5.43859L24.5329 0.270309C24.6622 0.172947 24.8159 0.124268 24.9695 0.124268C25.0989 0.124268 25.2122 0.148609 25.3333 0.213517C25.576 0.351445 25.738 0.602964 25.738 0.895049Z" fill="white"/></g></g></svg>',
          type: 'image/svg+xml',
        }
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

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
