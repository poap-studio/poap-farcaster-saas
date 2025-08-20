import { Metadata } from "next";
import DropContent from "./DropContent";

interface MetadataProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  
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
    const frameUrl = `${baseUrl}/drop/${slug}`;
    const frameImageUrl = `${baseUrl}/api/frame-image?dropId=${drop.id}`;

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

export default async function DropPage({ params }: PageProps) {
  const { slug } = await params;
  return <DropContent slug={slug} />;
}