"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function LumaCookiePage() {
  const router = useRouter();
  const [cookie, setCookie] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkCurrentCookie();
  }, []);

  const checkCurrentCookie = async () => {
    try {
      const response = await fetch("/api/admin/luma-cookie/status");
      const data = await response.json();
      
      setIsValid(data.isValid);
      if (data.hasEnvCookie) {
        toast.success("Luma cookie is configured via environment variable");
      }
    } catch (error) {
      console.error("Error checking cookie status:", error);
      setIsValid(false);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cookie.includes("luma.auth-session-key=")) {
      toast.error("Invalid cookie format. Must include 'luma.auth-session-key='");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/luma-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update cookie");
      }

      toast.success("Cookie updated successfully!");
      setCookie("");
      await checkCurrentCookie();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Checking cookie status...</div>
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
            <h1 className="text-3xl font-bold text-white mb-6">Luma Cookie Management</h1>

            {/* Status */}
            <div className={`rounded-lg p-4 mb-6 ${isValid ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white font-medium">
                  Cookie Status: {isValid ? 'Valid' : 'Invalid or Expired'}
                </span>
              </div>
              {!isValid && (
                <p className="text-gray-300 text-sm mt-2">
                  The Luma cookie needs to be updated to continue accessing event data.
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-slate-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">How to get the cookie:</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Open Chrome and go to <a href="https://lu.ma" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">lu.ma</a></li>
                <li>Login with admin@poap.fr account</li>
                <li>Open Chrome DevTools (F12 or right-click → Inspect)</li>
                <li>Go to the Application tab</li>
                <li>In the left sidebar, expand Cookies → https://lu.ma</li>
                <li>Find the cookie named <code className="bg-slate-600 px-2 py-1 rounded">luma.auth-session-key</code></li>
                <li>Copy the entire value (starts with usr-...)</li>
                <li>Paste it below with the format: <code className="bg-slate-600 px-2 py-1 rounded">luma.auth-session-key=usr-...</code></li>
              </ol>
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateCookie} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cookie Value
                </label>
                <textarea
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="luma.auth-session-key=usr-..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !cookie}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Cookie"}
              </button>
            </form>

            {/* AWS Service Info */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Automatic Updates</h3>
              <p className="text-gray-300 text-sm">
                An AWS service is configured to automatically renew this cookie every 24 hours. 
                Manual updates should only be necessary if the automatic service fails.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}