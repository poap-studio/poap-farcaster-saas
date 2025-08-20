import { Metadata } from "next";
import DropContent from "./DropContent";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/drops/slug/${params.slug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return {
        title: "POAP Drop Not Found",
      };
    }

    const { drop } = await response.json();

    const frameUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/drop/${params.slug}`;

    const frame = {
      version: "next",
      imageUrl: `${frameUrl}/api/frame-image`,
      button: {
        title: `Mint POAP #${drop.poapEventId}`,
        action: {
          type: "launch_frame",
          name: `Mint POAP #${drop.poapEventId}`,
          url: frameUrl,
          splashImageUrl: drop.logoUrl || `${frameUrl}/group0.svg`,
          splashBackgroundColor: "#f7f7f7",
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
          url: `${frameUrl}/api/frame-image`,
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

export default function DropPage({ params }: { params: { slug: string } }) {
  return <DropContent slug={params.slug} />;
}