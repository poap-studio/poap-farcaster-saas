"use client";

import { useEffect, useState, useCallback } from "react";
import POAPMinter from "~/components/POAPMinter";
import DropStyleWrapper from "~/components/DropStyleWrapper";

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

interface DropContentProps {
  slug: string;
  initialDrop?: Drop;
}

export default function DropContent({ slug, initialDrop }: DropContentProps) {
  const [drop, setDrop] = useState<Drop | null>(initialDrop || null);
  const [loading, setLoading] = useState(!initialDrop);
  const [error, setError] = useState<string | null>(null);

  const fetchDrop = useCallback(async () => {
    // Skip fetch if we already have initial data
    if (initialDrop) {
      return;
    }
    
    try {
      const response = await fetch(`/api/drops/slug/${slug}`);
      if (!response.ok) {
        throw new Error("Drop not found");
      }
      const { drop } = await response.json();
      setDrop(drop);
      
      // Set drop data in localStorage for components to use
      localStorage.setItem("currentDrop", JSON.stringify(drop));
      
      // Also set environment variables for the components
      if (typeof window !== 'undefined') {
        (window as Window & { __DROP_DATA__?: Drop }).__DROP_DATA__ = drop;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drop");
    } finally {
      setLoading(false);
    }
  }, [slug, initialDrop]);

  useEffect(() => {
    if (drop) {
      // Set drop data in localStorage and window for components to use
      localStorage.setItem("currentDrop", JSON.stringify(drop));
      if (typeof window !== 'undefined') {
        (window as Window & { __DROP_DATA__?: Drop }).__DROP_DATA__ = drop;
      }
    } else {
      fetchDrop();
    }
  }, [fetchDrop, drop]);

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

  // Apply custom styles with inline styles for better Farcaster compatibility
  return (
    <DropStyleWrapper 
      backgroundColor={drop.backgroundColor} 
      buttonColor={drop.buttonColor}
    >
      <div 
        style={{
          backgroundColor: drop.backgroundColor,
          minHeight: '100vh',
          width: '100%',
        }}
      >
        <style jsx global>{`
          :root {
            --drop-button-color: ${drop.buttonColor};
            --drop-background-color: ${drop.backgroundColor};
          }
        `}</style>
        <POAPMinter initialDrop={drop} />
      </div>
    </DropStyleWrapper>
  );
}