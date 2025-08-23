"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import LumaGuideModal from "~/components/LumaGuideModal";

export default function NewLumaDropPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showLumaGuide, setShowLumaGuide] = useState(false);
  const [eventData, setEventData] = useState<{
    name: string;
    start_at: string;
    guests_count: number;
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

  const extractEventId = (url: string): string | null => {
    // Handle format: https://lu.ma/event/manage/evt-XXX
    const manageMatch = url.match(/\/event\/manage\/(evt-[a-zA-Z0-9]+)/);
    if (manageMatch) return manageMatch[1];
    
    // Handle format: https://lu.ma/XXX
    const shortMatch = url.match(/lu\.ma\/([a-zA-Z0-9]+)$/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  };

  const validateEvent = async () => {
    const eventId = extractEventId(formData.eventUrl);
    if (!eventId) {
      toast.error("Invalid Luma event URL format");
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
        if (data.showLumaGuide) {
          setShowLumaGuide(true);
        }
        throw new Error(data.error || "Failed to validate event");
      }

      setEventData(data.event);
      toast.success("Event validated successfully!");
    } catch (error) {
      toast.error((error as Error).message);
      setEventData(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventData) {
      toast.error("Please validate the event first");
      return;
    }

    const eventId = extractEventId(formData.eventUrl);
    if (!eventId) {
      toast.error("Invalid event URL");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "luma",
          lumaEventId: eventId,
          lumaEventUrl: formData.eventUrl,
          deliveryMethod: formData.deliveryMethod,
          emailSubject: formData.emailSubject,
          emailBody: formData.emailBody,
          poapEventId: formData.poapEventId,
          poapSecretCode: formData.poapSecretCode,
          // Default values for Luma drops
          buttonColor: "#db2777",
          backgroundColor: "#831843",
          mintMessage: `This POAP commemorates your attendance at ${eventData.name}`,
          disclaimerMessage: "By claiming this POAP you accept these terms: https://poap.xyz/terms",
          requireFollow: false,
          requireRecast: false,
          requireQuote: false,
          isActive: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create drop");
      }

      toast.success("Luma drop created successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

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
              <span className="text-3xl">🌟</span>
              <h1 className="text-3xl font-bold text-white">Create Luma Drop</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Luma Event URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.eventUrl}
                    onChange={(e) => setFormData({ ...formData, eventUrl: e.target.value })}
                    placeholder="https://lu.ma/event/manage/evt-XXX or https://lu.ma/XXX"
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={validateEvent}
                    disabled={!formData.eventUrl || validating}
                    className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {validating ? "Validating..." : "Validate"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter the URL from your Luma event page
                </p>
              </div>

              {/* Event Info */}
              {eventData && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{eventData.name}</h3>
                  <p className="text-sm text-gray-300">
                    Date: {new Date(eventData.start_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-300">
                    Total guests: {eventData.guests_count || 0}
                  </p>
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
                    <span className="text-white">Manual - Send POAPs after the event</span>
                  </label>
                  <label className="flex items-center opacity-50">
                    <input
                      type="radio"
                      value="automatic"
                      disabled
                      className="mr-2"
                    />
                    <span className="text-gray-400">Automatic - Send on check-in (Coming soon)</span>
                  </label>
                </div>
              </div>

              {/* Email Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Email Configuration</h3>
                
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
                  disabled={loading || !eventData || !formData.poapEventId || !formData.poapSecretCode}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Luma Drop"}
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