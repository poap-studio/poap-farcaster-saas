"use client";

import { useState, useEffect, useCallback } from "react";

interface DropPreviewProps {
  poapEventId: string;
  buttonColor: string;
  backgroundColor: string;
  logoUrl?: string;
  mintMessage: string;
  requireFollow: boolean;
  followUsername?: string;
  requireRecast: boolean;
}

export default function DropPreview({
  poapEventId,
  buttonColor,
  backgroundColor,
  logoUrl,
  mintMessage,
  requireFollow,
  followUsername,
  requireRecast,
}: DropPreviewProps) {
  const [activeScreen, setActiveScreen] = useState<"requirements" | "mint">("requirements");
  const [poapImage, setPoapImage] = useState<string>("/poap-image0.png");
  const [isLoadingPoap, setIsLoadingPoap] = useState(false);

  // Fetch POAP image when event ID changes
  const fetchPoapImage = useCallback(async () => {
    if (!poapEventId) return;
    
    setIsLoadingPoap(true);
    try {
      const response = await fetch(`/api/poap/validate-event?eventId=${poapEventId}`);
      if (response.ok) {
        const data = await response.json();
        setPoapImage(data.event.image_url || "/poap-image0.png");
      }
    } catch (error) {
      console.error("Error fetching POAP image:", error);
    } finally {
      setIsLoadingPoap(false);
    }
  }, [poapEventId]);

  // Fetch POAP image when component mounts or eventId changes
  useEffect(() => {
    fetchPoapImage();
  }, [fetchPoapImage]);

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Frame Preview</h3>
      
      {/* Screen Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveScreen("requirements")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeScreen === "requirements"
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          Requirements Screen
        </button>
        <button
          onClick={() => setActiveScreen("mint")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeScreen === "mint"
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          Mint Screen
        </button>
      </div>

      {/* Preview Container */}
      <div className="relative mx-auto" style={{ width: "390px", height: "844px" }}>
        <div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{ backgroundColor }}
        >
          {/* Logo */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
            <img src={logoUrl || "/logo.svg"} alt="" style={{ width: 'auto', height: 'auto', maxHeight: '48px' }} />
          </div>

          {/* Card */}
          <div className="absolute top-24 left-6 right-6 bg-black rounded-xl p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-white text-2xl font-bold mb-4">
                Get your<br />POAP
              </h2>
              <div className="w-48 h-48 mx-auto relative">
                {isLoadingPoap ? (
                  <div className="w-full h-full rounded-full bg-slate-800 animate-pulse" />
                ) : (
                  <img
                    src={poapImage}
                    alt="POAP"
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
              </div>
            </div>

            {activeScreen === "requirements" ? (
              <>
                {/* Requirements Screen */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-lg font-bold">Requirements</h3>
                    <button className="text-white text-sm flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M10.5 2.5V5.5H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1.5 9.5V6.5H4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.205 4.5C2.451 3.621 2.97825 2.85075 3.7095 2.301C4.44075 1.75125 5.33625 1.452 6.25875 1.452C7.18125 1.452 8.07675 1.75125 8.808 2.301C9.53925 2.85075 10.0665 3.621 10.3125 4.5M1.6875 7.5C1.9335 8.379 2.46075 9.14925 3.192 9.699C3.92325 10.2488 4.81875 10.548 5.74125 10.548C6.66375 10.548 7.55925 10.2488 8.2905 9.699C9.02175 9.14925 9.549 8.379 9.795 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Refresh</span>
                    </button>
                  </div>
                  
                  <p className="text-gray-400 text-sm">
                    {requireFollow && requireRecast ? "Complete both steps to unlock your POAP:" :
                     requireFollow || requireRecast ? "Complete the step to unlock your POAP:" :
                     "Your POAP is ready to claim!"}
                  </p>

                  <div className="space-y-3">
                    {requireFollow && (
                      <div className="flex justify-between items-center bg-slate-900 rounded-lg p-4">
                        <div>
                          <p className="text-white font-medium">Follow @{followUsername || "username"}</p>
                          <p className="text-gray-400 text-sm">on Farcaster</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                          Follow
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {requireRecast && (
                      <div className="flex justify-between items-center bg-slate-900 rounded-lg p-4">
                        <div>
                          <p className="text-white font-medium">Recast the original cast</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                          Recast
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    className="w-full py-4 rounded-lg text-white font-bold text-lg mt-6"
                    style={{ backgroundColor: buttonColor }}
                    disabled={requireFollow || requireRecast}
                  >
                    Claim POAP
                  </button>
                  
                  <p className="text-gray-400 text-xs text-center">
                    Once both steps are done, your POAP will be ready to claim it.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Mint Screen */}
                <div className="space-y-4">
                  <h3 className="text-white text-lg font-bold text-center">Mint Your POAP</h3>
                  
                  <p className="text-gray-400 text-sm text-center">
                    {mintMessage}
                  </p>

                  <div className="bg-slate-900 rounded-lg p-3">
                    <input
                      type="text"
                      placeholder="Enter wallet address or ENS name"
                      className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
                      disabled
                    />
                  </div>

                  <button
                    className="w-full py-4 rounded-lg text-white font-bold text-lg mt-6"
                    style={{ backgroundColor: buttonColor }}
                  >
                    Mint POAP
                  </button>
                  
                  <p className="text-gray-400 text-xs text-center">
                    {mintMessage}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}