import { Metadata } from "next";
import { redirect } from "next/navigation";

interface MetadataProps {
  params: Promise<{ slug: string }>;
}

const FRAME_URL = process.env.NEXT_PUBLIC_FRAME_URL 
  || (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : '');

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/drops/${slug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return {
        title: "POAP Drop Not Found",
      };
    }

    const { drop } = await response.json();
    const timestamp = Date.now();
    const frameImageUrl = `${FRAME_URL}/api/frame-image?dropId=${slug}&t=${timestamp}`;
    const title = `Mint POAP #${drop.poapEventId}`;

    const frame = {
      version: "next",
      imageUrl: frameImageUrl,
      button: {
        title: title,
        action: {
          type: "launch_frame",
          name: title,
          url: `${FRAME_URL}/drop/${drop.slug}`,
          splashImageUrl: drop.logoUrl || `${FRAME_URL}/logo.svg`,
          splashBackgroundColor: drop.backgroundColor || "#f7f7f7",
        },
      },
    };

    return {
      title: title,
      description: drop.mintMessage,
      openGraph: {
        title: title,
        description: drop.mintMessage,
        images: [{
          url: frameImageUrl,
          alt: title
        }]
      },
      other: {
        "fc:frame": JSON.stringify(frame),
        "fc:frame:image": frameImageUrl,
        "fc:frame:post_url": `${FRAME_URL}/drop/${drop.slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "POAP Drop",
    };
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SharePage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch drop to get the actual slug
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/drops/${slug}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const { drop } = await response.json();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      redirect(`/drop/${drop.slug}?t=${timestamp}&rid=${randomId}&src=share`);
    }
  } catch (error) {
    console.error("Error fetching drop:", error);
  }

  // Fallback if redirect fails
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1e293b'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading POAP Frame...</h1>
        <p style={{ color: '#94a3b8' }}>Please wait while we redirect you.</p>
      </div>
    </div>
  );
}