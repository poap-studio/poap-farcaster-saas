"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import POAPMinter from "~/components/POAPMinter";

interface Drop {
  id: string;
  slug: string;
  poapEventId: string;
  buttonColor: string;
  backgroundColor: string;
  logoUrl?: string;
  mintMessage: string;
  requireFollow: boolean;
  followUsername?: string;
  requireRecast: boolean;
}

export default function DropContent({ slug }: { slug: string }) {
  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrop();
  }, [slug]);

  const fetchDrop = async () => {
    try {
      const response = await fetch(`/api/drops/slug/${slug}`);
      if (!response.ok) {
        throw new Error("Drop not found");
      }
      const { drop } = await response.json();
      setDrop(drop);
      
      // Set drop data in localStorage for components to use
      localStorage.setItem("currentDrop", JSON.stringify(drop));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drop");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Drop Not Found</h1>
          <p className="text-gray-400">{error || "This drop does not exist or has been removed."}</p>
        </div>
      </div>
    );
  }

  // Apply custom styles
  return (
    <>
      <style jsx global>{`
        :root {
          --drop-button-color: ${drop.buttonColor};
          --drop-background-color: ${drop.backgroundColor};
        }
      `}</style>
      <POAPMinter />
    </>
  );
}