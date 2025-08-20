import { Metadata } from "next";
import DropContent from "./DropContent";

interface MetadataProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: MetadataProps & { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const { slug } = await params;
  const search = await searchParams;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/drops/slug/${slug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return {
        title: "POAP Drop Not Found",
      };
    }

    const { drop } = await response.json();

    const baseUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}`;
    // Use timestamp from URL if available, otherwise generate new one
    const urlTimestamp = search?.t || Date.now().toString();
    // Add random component to ensure uniqueness
    const randomId = Math.random().toString(36).substring(7);
    const frameUrl = `${baseUrl}/drop/${slug}?t=${urlTimestamp}&rid=${randomId}`;
    // Use same timestamp for image to ensure consistency
    const frameImageUrl = `${baseUrl}/api/frame-image?dropId=${drop.id}&t=${urlTimestamp}&v=${drop.updatedAt}&rid=${randomId}`;

    const frame = {
      version: "next",
      imageUrl: frameImageUrl,
      button: {
        title: `Mint POAP #${drop.poapEventId}`,
        action: {
          type: "launch_frame",
          name: `Mint POAP #${drop.poapEventId}`,
          url: frameUrl,
          splashImageUrl: drop.logoUrl || `${baseUrl}/logo.svg`,
          splashBackgroundColor: drop.backgroundColor || "#f7f7f7",
        },
      },
    };

    return {
      title: `Mint POAP #${drop.poapEventId}`,
      description: drop.mintMessage,
      openGraph: {
        title: `Mint POAP #${drop.poapEventId}`,
        description: drop.mintMessage,
        images: [{
          url: frameImageUrl,
          alt: `POAP #${drop.poapEventId}`
        }]
      },
      other: {
        "fc:frame": JSON.stringify(frame),
        "fc:frame:image": frameImageUrl,
        "fc:frame:post_url": frameUrl,
        // Add unique identifier to help Farcaster differentiate between drops
        "fc:frame:id": `${drop.id}-${urlTimestamp}-${randomId}`,
        "fc:frame:state": JSON.stringify({ dropId: drop.id, timestamp: urlTimestamp, rid: randomId }),
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

export default async function DropPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch drop data server-side
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/drops/slug/${slug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return <DropContent slug={slug} />;
    }

    const { drop } = await response.json();
    return <DropContent slug={slug} initialDrop={drop} />;
  } catch (error) {
    console.error("Error fetching drop:", error);
    return <DropContent slug={slug} />;
  }
}