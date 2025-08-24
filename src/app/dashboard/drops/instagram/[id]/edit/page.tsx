"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface InstagramStory {
  id: string;
  media_url: string;
  media_type: string;
  timestamp: string;
  permalink: string;
}

export default function EditInstagramDropPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [dropId, setDropId] = useState<string>("");
  const [validatingPoap, setValidatingPoap] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);
  const [stories, setStories] = useState<InstagramStory[]>([]);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramAccount, setInstagramAccount] = useState<{
    id: string;
    username: string;
  } | null>(null);
  
  const [poapData, setPoapData] = useState<{
    name: string;
    description: string;
    image_url: string;
    expiry_date?: string;
    stats: {
      total: number;
      claimed: number;
      available: number;
    };
  } | null>(null);
  const [poapWarning, setPoapWarning] = useState<string | null>(null);
  const [poapError, setPoapError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    poapEventId: "",
    poapSecretCode: "",
    selectedStoryId: "",
    selectedStoryUrl: "",
    acceptedFormats: ["email"] as string[],
    sendPoapEmail: true,
    successMessage: "🎉 Your POAP has been delivered to {{recipient}}! Thank you for participating.",
    alreadyClaimedMessage: "You have already claimed this POAP. Each person can only claim one POAP per event.",
    invalidFormatMessage: "Please include your email address, ENS name, or Ethereum address in your message to receive the POAP."
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setDropId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  const fetchDrop = useCallback(async () => {
    try {
      const response = await fetch(`/api/drops/${dropId}`);
      if (response.ok) {
        const { drop } = await response.json();
        
        // Ensure it's an Instagram drop
        if (drop.platform !== 'instagram') {
          toast.error("This is not an Instagram drop");
          router.push("/dashboard");
          return;
        }
        
        // Set form data
        setFormData({
          poapEventId: drop.poapEventId,
          poapSecretCode: drop.poapSecretCode,
          selectedStoryId: drop.instagramStoryId || "",
          selectedStoryUrl: drop.instagramStoryUrl || "",
          acceptedFormats: drop.acceptedFormats || ["email"],
          sendPoapEmail: drop.sendPoapEmail ?? true,
          successMessage: drop.instagramMessages?.successMessage || formData.successMessage,
          alreadyClaimedMessage: drop.instagramMessages?.alreadyClaimedMessage || formData.alreadyClaimedMessage,
          invalidFormatMessage: drop.instagramMessages?.invalidFormatMessage || formData.invalidFormatMessage
        });

        // Set Instagram account if exists
        if (drop.instagramAccountId) {
          setInstagramConnected(true);
          setInstagramAccount({
            id: drop.instagramAccountId,
            username: drop.instagramAccount?.username || ""
          });
          
          // Load stories
          loadInstagramStories();
        }
        
        // Validate POAP data
        validatePoap();
      } else {
        toast.error("Drop not found");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to fetch drop");
      router.push("/dashboard");
    } finally {
      setFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId, router]);

  useEffect(() => {
    if (dropId) {
      fetchDrop();
    }
  }, [dropId, fetchDrop]);

  const validatePoap = async () => {
    if (!formData.poapEventId || !formData.poapSecretCode) {
      setPoapData(null);
      setPoapWarning(null);
      setPoapError(null);
      return;
    }

    setValidatingPoap(true);
    setPoapWarning(null);
    setPoapError(null);

    try {
      // Validate POAP event
      const eventResponse = await fetch(`/api/poap/validate-event?eventId=${formData.poapEventId}`);
      const poapEventData = await eventResponse.json();

      if (!eventResponse.ok) {
        setPoapData(null);
        setPoapError(poapEventData.error || "Invalid POAP event");
        return;
      }

      // Get POAP stats
      const statsResponse = await fetch(`/api/poap/stats?eventId=${formData.poapEventId}&secretCode=${encodeURIComponent(formData.poapSecretCode)}`);
      const statsData = await statsResponse.json();

      if (!statsResponse.ok) {
        setPoapData(null);
        setPoapError(statsData.error || "Invalid secret code");
        return;
      }

      const poapInfo = {
        name: poapEventData.event.name,
        description: poapEventData.event.description || "",
        image_url: poapEventData.event.image_url,
        expiry_date: poapEventData.event.expiry_date,
        stats: statsData
      };

      setPoapData(poapInfo);
      setImageLoading(true); // Reset image loading state for new POAP

      // Check if there are available POAPs
      if (poapInfo.stats.available === 0) {
        setPoapError("No POAPs available! All POAPs have been claimed.");
      } else if (poapInfo.stats.available < 10) {
        setPoapWarning(`Warning: Only ${poapInfo.stats.available} POAPs remaining!`);
      }
    } catch {
      setPoapData(null);
      setPoapError("Failed to validate POAP");
    } finally {
      setValidatingPoap(false);
    }
  };

  // Auto-validate POAP when event ID or secret code changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.poapEventId && formData.poapSecretCode) {
        validatePoap();
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.poapEventId, formData.poapSecretCode]);

  const handleConnectInstagram = async () => {
    setConnectingInstagram(true);
    
    try {
      // Instagram OAuth URL
      const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || "631541192644294";
      const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/instagram-auth/callback`
        : `${window.location.origin}/api/instagram-auth/callback`;
      // Instagram Basic Display API scopes
      const scope = "user_profile,user_media";
      
      // Use Instagram OAuth
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
      
      // Open Instagram auth in popup
      const authWindow = window.open(authUrl, 'instagram-auth', 'width=600,height=700');
      
      // Listen for auth completion
      const checkInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkInterval);
          setConnectingInstagram(false);
          // Check if auth was successful
          checkInstagramConnection();
        }
      }, 1000);
      
    } catch {
      toast.error("Failed to connect Instagram");
      setConnectingInstagram(false);
    }
  };

  const checkInstagramConnection = async () => {
    try {
      const response = await fetch("/api/instagram-auth/status");
      const data = await response.json();
      
      if (data.connected) {
        setInstagramConnected(true);
        setInstagramAccount(data.account);
        toast.success("Instagram connected successfully!");
        // Load stories
        loadInstagramStories();
      }
    } catch {
      console.error("Error checking Instagram connection");
    }
  };

  const loadInstagramStories = async () => {
    setLoadingStories(true);
    try {
      const response = await fetch("/api/instagram-auth/stories");
      const data = await response.json();
      
      if (response.ok) {
        setStories(data.stories);
      } else {
        toast.error("Failed to load Instagram stories");
      }
    } catch {
      toast.error("Failed to load Instagram stories");
    } finally {
      setLoadingStories(false);
    }
  };

  const handleFormatToggle = (format: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedFormats: prev.acceptedFormats.includes(format)
        ? prev.acceptedFormats.filter(f => f !== format)
        : [...prev.acceptedFormats, format]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instagramConnected) {
      toast.error("Please connect your Instagram account first");
      return;
    }

    if (!formData.selectedStoryId) {
      toast.error("Please select an Instagram story");
      return;
    }

    if (formData.acceptedFormats.length === 0) {
      toast.error("Please select at least one accepted format");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/drops/${dropId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramStoryId: formData.selectedStoryId,
          instagramStoryUrl: formData.selectedStoryUrl,
          instagramAccountId: instagramAccount?.id,
          acceptedFormats: formData.acceptedFormats,
          sendPoapEmail: formData.sendPoapEmail,
          poapEventId: formData.poapEventId,
          poapSecretCode: formData.poapSecretCode,
          instagramMessages: {
            successMessage: formData.successMessage,
            alreadyClaimedMessage: formData.alreadyClaimedMessage,
            invalidFormatMessage: formData.invalidFormatMessage
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update drop");
      }

      toast.success("Instagram drop updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Image 
                src="/icons/instagram.png" 
                alt="Instagram" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-3xl font-bold text-white">Edit Instagram Drop</h1>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instagram Connection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Instagram Account</h3>
                
                {!instagramConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectInstagram}
                    disabled={connectingInstagram}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connectingInstagram ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Image src="/icons/instagram.png" alt="Instagram" width={20} height={20} />
                        Connect your Instagram Account
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image src="/icons/instagram.png" alt="Instagram" width={24} height={24} />
                      <div>
                        <p className="text-white font-medium">@{instagramAccount?.username}</p>
                        <p className="text-sm text-gray-400">Connected</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleConnectInstagram}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Reconnect
                    </button>
                  </div>
                )}
              </div>

              {/* Story Selection */}
              {instagramConnected && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Select Story</h3>
                  <p className="text-sm text-gray-400">Select the story that users will reply to</p>
                  
                  {loadingStories ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    </div>
                  ) : stories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {stories.map((story) => (
                        <button
                          key={story.id}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            selectedStoryId: story.id,
                            selectedStoryUrl: story.permalink
                          })}
                          className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${
                            formData.selectedStoryId === story.id
                              ? "border-pink-500 ring-2 ring-pink-500 ring-opacity-50"
                              : "border-slate-600 hover:border-slate-500"
                          }`}
                        >
                          {story.media_type === "VIDEO" ? (
                            <video
                              src={story.media_url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={story.media_url}
                              alt="Story"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {formData.selectedStoryId === story.id && (
                            <div className="absolute inset-0 bg-pink-500 bg-opacity-20 flex items-center justify-center">
                              <div className="bg-pink-500 rounded-full p-2">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-700 rounded-lg">
                      <p className="text-gray-400">No stories found. Please post a story on Instagram first.</p>
                    </div>
                  )}
                </div>
              )}

              {/* POAP Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">POAP Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    POAP Event ID
                  </label>
                  <input
                    type="text"
                    value={formData.poapEventId}
                    onChange={(e) => setFormData({ ...formData, poapEventId: e.target.value })}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    POAP Secret Code
                  </label>
                  <input
                    type="text"
                    value={formData.poapSecretCode}
                    onChange={(e) => setFormData({ ...formData, poapSecretCode: e.target.value })}
                    placeholder="Enter the 6-digit secret code"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                {/* POAP Validation Info */}
                {validatingPoap && (
                  <div className="flex items-center justify-center p-4 bg-slate-700 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600 mr-3"></div>
                    <span className="text-gray-300">Validating POAP...</span>
                  </div>
                )}

                {poapData && (
                  <div className="bg-slate-700 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24">
                        {imageLoading && (
                          <div className="absolute inset-0 bg-slate-600 rounded-lg animate-pulse z-10" />
                        )}
                        <Image 
                          src={poapData.image_url} 
                          alt={poapData.name}
                          width={96}
                          height={96}
                          className={`w-24 h-24 rounded-lg object-cover transition-opacity duration-300 ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                          }`}
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{poapData.name}</h4>
                        {poapData.description && (
                          <p className="text-sm text-gray-300 mt-1">{poapData.description}</p>
                        )}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total POAPs:</span>
                            <span className="text-white font-medium">{poapData.stats.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Already claimed:</span>
                            <span className="text-yellow-400 font-medium">{poapData.stats.claimed}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Available:</span>
                            <span className="text-green-400 font-medium">{poapData.stats.available}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {poapError && (
                  <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
                    <p className="text-sm text-red-400">{poapError}</p>
                  </div>
                )}

                {poapWarning && !poapError && (
                  <div className="p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                    <p className="text-sm text-yellow-400">{poapWarning}</p>
                  </div>
                )}
              </div>

              {/* Accepted Formats */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Accepted Formats</h3>
                <p className="text-sm text-gray-400">Select which formats users can use to receive their POAP</p>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptedFormats.includes("email")}
                      onChange={() => handleFormatToggle("email")}
                      className="mt-1 text-pink-600 focus:ring-pink-500 border-slate-600 bg-slate-700 rounded"
                    />
                    <div>
                      <span className="text-white font-medium">Email Address</span>
                      <p className="text-sm text-gray-400">Users can provide their email to receive the POAP</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptedFormats.includes("address")}
                      onChange={() => handleFormatToggle("address")}
                      className="mt-1 text-pink-600 focus:ring-pink-500 border-slate-600 bg-slate-700 rounded"
                    />
                    <div>
                      <span className="text-white font-medium">Ethereum Address</span>
                      <p className="text-sm text-gray-400">Users can provide their ETH address (0x...)</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptedFormats.includes("ens")}
                      onChange={() => handleFormatToggle("ens")}
                      className="mt-1 text-pink-600 focus:ring-pink-500 border-slate-600 bg-slate-700 rounded"
                    />
                    <div>
                      <span className="text-white font-medium">ENS Name</span>
                      <p className="text-sm text-gray-400">Users can provide their ENS name (name.eth)</p>
                    </div>
                  </label>
                </div>

                {formData.acceptedFormats.includes("email") && (
                  <div className="ml-6 p-3 bg-slate-700 rounded-lg">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.sendPoapEmail}
                        onChange={(e) => setFormData({ ...formData, sendPoapEmail: e.target.checked })}
                        className="text-pink-600 focus:ring-pink-500 border-slate-600 bg-slate-600 rounded"
                      />
                      <span className="text-white text-sm">Send POAP confirmation email</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      POAP will send an email to the user when the POAP is minted
                    </p>
                  </div>
                )}
              </div>

              {/* Response Messages */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Response Messages</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Success Message
                  </label>
                  <textarea
                    value={formData.successMessage}
                    onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    placeholder="Message sent when POAP is delivered"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Use {"{{recipient}}"} to include the user&apos;s email, ENS, or address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Already Claimed Message
                  </label>
                  <textarea
                    value={formData.alreadyClaimedMessage}
                    onChange={(e) => setFormData({ ...formData, alreadyClaimedMessage: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    placeholder="Message sent when user already claimed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invalid Format Message
                  </label>
                  <textarea
                    value={formData.invalidFormatMessage}
                    onChange={(e) => setFormData({ ...formData, invalidFormatMessage: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    placeholder="Message sent when no valid email/ENS/address found"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !instagramConnected || !formData.selectedStoryId || !formData.poapEventId || !formData.poapSecretCode || !!poapError || formData.acceptedFormats.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Instagram Drop"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}