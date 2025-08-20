import { Metadata } from "next";

interface MetadataProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    
    const response = await fetch(
      `${baseUrl}/api/drops/${slug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return {
        title: "POAP Drop Not Found",
      };
    }

    const { drop } = await response.json();
    const timestamp = Date.now();
    const frameImageUrl = `${baseUrl}/api/frame-image?dropId=${slug}&t=${timestamp}`;
    const title = `Mint POAP #${drop.poapEventId}`;

    // Frame v2 structure
    const frame = {
      version: "next",
      imageUrl: frameImageUrl,
      button: {
        title: title,
        action: {
          type: "launch_frame",
          name: title,
          url: `${baseUrl}/drop/${drop.slug}`,
          splashImageUrl: drop.logoUrl || `${baseUrl}/logo.svg`,
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
          width: 1200,
          height: 630,
          alt: title
        }]
      },
      other: {
        "fc:frame": JSON.stringify(frame),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "POAP Drop",
    };
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SharePage() {
  // Simple page that exists just to serve frame metadata
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
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>POAP Frame</h1>
        <p style={{ color: '#94a3b8' }}>Share this link on Farcaster to display the frame.</p>
      </div>
    </div>
  );
}