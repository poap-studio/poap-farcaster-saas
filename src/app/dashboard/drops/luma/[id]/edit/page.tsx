"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import LumaGuideModal from "~/components/LumaGuideModal";
import { fetchEventIdFromShortUrl } from "~/lib/luma-scraper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditLumaDropPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [dropId, setDropId] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [showLumaGuide, setShowLumaGuide] = useState(false);
  const [validatingPoap, setValidatingPoap] = useState(false);
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
  const [imageLoading, setImageLoading] = useState(false);
  const [shouldValidateEvent, setShouldValidateEvent] = useState(false);
  const [eventData, setEventData] = useState<{
    name: string;
    start_at: string;
    end_at?: string;
    guests_count: number;
    guestStats?: {
      total: number;
      going: number;
      checkedIn: number;
      registered: number;
    };
  } | null>(null);
  
  const [formData, setFormData] = useState({
    eventUrl: "",
    deliveryMethod: "manual",
    emailSubject: "Your POAP for {{eventName}}",
    emailBody: `Hi {{name}},

Thank you for attending {{eventName}}! 

Here's your exclusive POAP to commemorate your participation:

{{poapLink}}

This POAP is a digital collectible that proves your attendance and becomes part of your permanent record on the blockchain.

Best regards,
The {{eventName}} Team`,
    poapEventId: "",
    poapSecretCode: ""
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
        
        // Ensure it's a Luma drop
        if (drop.platform !== 'luma') {
          toast.error("This is not a Luma drop");
          router.push("/dashboard");
          return;
        }
        
        setFormData({
          eventUrl: drop.lumaEventUrl || "",
          deliveryMethod: drop.deliveryMethod || "manual",
          emailSubject: drop.emailSubject || "Your POAP for {{eventName}}",
          emailBody: drop.emailBody || formData.emailBody,
          poapEventId: drop.poapEventId,
          poapSecretCode: drop.poapSecretCode
        });

        // Validate POAP to show the image first
        if (drop.poapEventId && drop.poapSecretCode) {
          validatePoap(drop.poapEventId, drop.poapSecretCode);
        }
        
        // Validate the event URL to get event data after POAP is loaded
        if (drop.lumaEventUrl) {
          setShouldValidateEvent(true);
        }
      }
    } catch (error) {
      console.error("Fetch drop error:", error);
      toast.error("Failed to fetch drop");
    } finally {
      setFetching(false);
    }
  }, [dropId, router]);

  useEffect(() => {
    if (dropId) {
      fetchDrop();
    }
  }, [dropId, fetchDrop]);

  const extractEventId = async (url: string): Promise<string | null> => {
    // Handle format: https://lu.ma/event/manage/evt-XXX
    const manageMatch = url.match(/\/event\/manage\/(evt-[a-zA-Z0-9]+)/);
    if (manageMatch) return manageMatch[1];
    
    // Handle format: https://lu.ma/user/usr-XXX?e=evt-XXX
    try {
      const urlObj = new URL(url);
      const eventParam = urlObj.searchParams.get('e');
      if (eventParam && eventParam.startsWith('evt-')) {
        return eventParam;
      }
    } catch {
      // Not a valid URL, continue with other patterns
    }
    
    // Handle format: https://lu.ma/XXX (short URL - needs scraping)
    const shortMatch = url.match(/lu\.ma\/([a-zA-Z0-9]+)$/);
    if (shortMatch) {
      // This is a short URL, we need to scrape it
      const eventId = await fetchEventIdFromShortUrl(url);
      return eventId;
    }
    
    return null;
  };

  const validateEvent = async (url: string) => {
    // Check if it's a valid URL
    try {
      new URL(url);
    } catch {
      setEventData(null);
      if (url.trim()) {
        toast.error("Please enter a valid URL");
      }
      return;
    }

    // Check if it's a Luma URL
    if (!url.includes("lu.ma")) {
      setEventData(null);
      toast.error("Please enter a Luma event URL");
      return;
    }

    const eventId = await extractEventId(url);
    if (!eventId) {
      setEventData(null);
      toast.error("Could not extract event ID from URL. Please check the URL and try again.");
      return;
    }

    setValidating(true);
    try {
      const response = await fetch("/api/luma/validate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId })
      });

      const data = await response.json();

      if (!response.ok) {
        // Always show the guide modal if showLumaGuide is true
        if (data.showLumaGuide === true) {
          setShowLumaGuide(true);
        }
        toast.error(data.error || "Failed to validate event");
        setEventData(null);
        return;
      }

      setEventData(data.event);
      toast.success("Event validated successfully!");
    } catch (error) {
      toast.error((error as Error).message || "Failed to validate event");
      setEventData(null);
    } finally {
      setValidating(false);
    }
  };

  const validatePoap = async (eventId?: string, secretCode?: string) => {
    const poapEventId = eventId || formData.poapEventId;
    const poapSecretCode = secretCode || formData.poapSecretCode;
    
    if (!poapEventId || !poapSecretCode) {
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
      const eventResponse = await fetch(`/api/poap/validate-event?eventId=${poapEventId}`);
      const poapEventData = await eventResponse.json();

      if (!eventResponse.ok) {
        setPoapData(null);
        setPoapError(poapEventData.error || "Invalid POAP event");
        return;
      }

      // Get POAP stats
      const statsResponse = await fetch(`/api/poap/stats?eventId=${poapEventId}&secretCode=${encodeURIComponent(poapSecretCode)}`);
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
      // Only set image loading if we're not already showing this POAP
      if (!poapData || poapData.image_url !== poapInfo.image_url) {
        setImageLoading(true);
      }

      // Check POAP expiry date vs event end date
      if (eventData && poapInfo.expiry_date && eventData.end_at) {
        const poapExpiryDate = new Date(poapInfo.expiry_date);
        const eventEndDate = new Date(eventData.end_at);
        
        if (poapExpiryDate < eventEndDate) {
          setPoapError(`POAP expires before event ends! POAP expires on ${poapExpiryDate.toLocaleDateString()} but event ends on ${eventEndDate.toLocaleDateString()}. Please use a POAP with a later expiry date.`);
          return;
        }
      }

      // Check if there are enough POAPs
      if (eventData && eventData.guestStats) {
        if (poapInfo.stats.available < eventData.guestStats.checkedIn) {
          setPoapError(`Not enough POAPs! You have ${poapInfo.stats.available} available but ${eventData.guestStats.checkedIn} checked-in guests.`);
        } else if (poapInfo.stats.available < eventData.guestStats.going) {
          setPoapWarning(`Warning: You have ${poapInfo.stats.available} POAPs available but ${eventData.guestStats.going} guests are going. Consider requesting more POAPs to ensure everyone receives one.`);
        }
      }
    } catch {
      setPoapData(null);
      setPoapError("Failed to validate POAP");
    } finally {
      setValidatingPoap(false);
    }
  };

  // Auto-validate when URL changes (but not on initial load)
  useEffect(() => {
    if (!fetching && !shouldValidateEvent) {
      const timeoutId = setTimeout(() => {
        if (formData.eventUrl) {
          validateEvent(formData.eventUrl);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.eventUrl, fetching]);

  // Validate event after POAP is loaded
  useEffect(() => {
    if (shouldValidateEvent && formData.eventUrl) {
      validateEvent(formData.eventUrl);
      setShouldValidateEvent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldValidateEvent, formData.eventUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventData) {
      toast.error("Please validate the event first");
      return;
    }

    const eventId = await extractEventId(formData.eventUrl);
    if (!eventId) {
      toast.error("Invalid event URL");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/drops/${dropId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lumaEventId: eventId,
          lumaEventUrl: formData.eventUrl,
          deliveryMethod: formData.deliveryMethod,
          emailSubject: formData.emailSubject,
          emailBody: formData.emailBody,
          poapEventId: formData.poapEventId,
          poapSecretCode: formData.poapSecretCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update drop");
      }

      toast.success("Luma drop updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
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
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Image 
                src="/icons/luma.svg" 
                alt="Luma" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-3xl font-bold text-white">Edit Luma Drop</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Luma Event URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.eventUrl}
                    onChange={(e) => setFormData({ ...formData, eventUrl: e.target.value })}
                    placeholder="https://lu.ma/event/manage/evt-XXX or https://lu.ma/XXX"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 pr-12"
                    required
                  />
                  {validating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {validating ? "Validating event..." : "Enter the URL from your Luma event page"}
                </p>
              </div>

              {/* Event Info */}
              {eventData && (
                <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-white">{eventData.name}</h3>
                  <p className="text-sm text-gray-300">
                    Date: {new Date(eventData.start_at).toLocaleDateString()}
                  </p>
                  
                  {eventData.guestStats ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total guests:</span>
                        <span className="text-white font-medium">{eventData.guestStats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Going:</span>
                        <span className="text-green-400 font-medium">{eventData.guestStats.going}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Checked in:</span>
                        <span className="text-blue-400 font-medium">{eventData.guestStats.checkedIn}</span>
                      </div>
                      <div className="mt-2 p-2 bg-blue-900/30 rounded text-xs text-blue-300">
                        {eventData.guestStats.checkedIn > 0 
                          ? `POAPs will be sent to ${eventData.guestStats.checkedIn} checked-in attendees after the event ends`
                          : "POAPs will be sent only to checked-in attendees after the event ends"
                        }
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300">
                      Total guests: {eventData.guests_count || 0}
                    </p>
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
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    POAP Secret Code
                  </label>
                  <input
                    type="text"
                    value={formData.poapSecretCode}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-gray-400 cursor-not-allowed"
                    disabled
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
                          key={poapData.image_url}
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

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="manual"
                      checked={formData.deliveryMethod === "manual"}
                      onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                      className="mr-2 text-pink-600"
                    />
                    <span className="text-white">Automatic - Send POAPs after the event</span>
                  </label>
                  <label className="flex items-center opacity-50">
                    <input
                      type="radio"
                      value="automatic"
                      disabled
                      className="mr-2"
                    />
                    <span className="text-gray-400">In Real Time - Send on check-in (Coming soon)</span>
                  </label>
                </div>
              </div>

              {/* Email Configuration */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">This is the email your attendees will receive</h3>
                  <p className="text-sm text-gray-400 mt-1">The POAP link will be included where you place {"{{poapLink}}"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Available variables: {"{{eventName}}"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Body
                  </label>
                  <textarea
                    value={formData.emailBody}
                    onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Available variables: {"{{name}}, {{eventName}}, {{poapLink}}"}
                  </p>
                </div>
              </div>


              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !eventData || !!poapError}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Luma Drop"}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Luma Guide Modal */}
      <LumaGuideModal 
        isOpen={showLumaGuide} 
        onClose={() => setShowLumaGuide(false)} 
      />
    </div>
  );
}