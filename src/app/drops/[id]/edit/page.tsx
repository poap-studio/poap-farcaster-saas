"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@farcaster/auth-kit";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import DropPreview from "~/components/admin/DropPreview";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDropPage({ params }: PageProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [dropId, setDropId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    poapEventId: "",
    poapSecretCode: "",
    buttonColor: "#8b5cf6",
    backgroundColor: "#1e293b",
    logoUrl: "",
    mintMessage: "",
    disclaimerMessage: "",
    requireFollow: true,
    followUsername: "",
    requireRecast: true,
    isActive: true,
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
        setFormData({
          poapEventId: drop.poapEventId,
          poapSecretCode: drop.poapSecretCode,
          buttonColor: drop.buttonColor,
          backgroundColor: drop.backgroundColor,
          logoUrl: drop.logoUrl || "",
          mintMessage: drop.mintMessage,
          disclaimerMessage: drop.disclaimerMessage || "By minting this POAP you accept these terms: https://poap.xyz/terms",
          requireFollow: drop.requireFollow,
          followUsername: drop.followUsername || "",
          requireRecast: drop.requireRecast,
          isActive: drop.isActive,
        });
      }
    } catch (error) {
      console.error("Fetch drop error:", error);
    } finally {
      setFetching(false);
    }
  }, [dropId]);

  useEffect(() => {
    if (dropId) {
      fetchDrop();
    }
  }, [dropId, fetchDrop]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get user ID
    const loginResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fid: profile?.fid,
        username: profile?.username,
        displayName: profile?.displayName,
        profileImage: profile?.pfpUrl,
      }),
    });

    if (!loginResponse.ok) {
      toast.error("Authentication failed");
      return;
    }

    const { user } = await loginResponse.json();

    setLoading(true);
    try {
      const response = await fetch(`/api/drops/${dropId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Drop updated successfully!");
        router.push("/");
      } else {
        toast.error("Failed to update drop");
      }
    } catch (error) {
      console.error("Update drop error:", error);
      toast.error("Failed to update drop");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Drop</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Form Column */}
        <div className="order-2 xl:order-1">
          <form onSubmit={handleSubmit} className="space-y-8">
        {/* POAP Configuration */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            POAP Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event ID
              </label>
              <input
                type="text"
                value={formData.poapEventId}
                className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secret Code
              </label>
              <input
                type="text"
                value={formData.poapSecretCode}
                className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Customization */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Customization
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Button Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="buttonColor"
                  value={formData.buttonColor}
                  onChange={handleInputChange}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.buttonColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, buttonColor: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleInputChange}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Logo URL (optional)
            </label>
            <input
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mint Message
            </label>
            <textarea
              name="mintMessage"
              value={formData.mintMessage}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Disclaimer Message
            </label>
            <textarea
              name="disclaimerMessage"
              value={formData.disclaimerMessage}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors resize-none"
              placeholder="By minting this POAP you accept these terms..."
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Requirements
          </h2>
          
          <div className="space-y-4">
            <div 
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, requireFollow: !prev.requireFollow }))}
            >
              <div>
                <label className="text-white font-medium cursor-pointer">
                  Require Follow
                </label>
                <p className="text-gray-400 text-sm">
                  Users must follow a specific account
                </p>
              </div>
              <input
                type="checkbox"
                name="requireFollow"
                checked={formData.requireFollow}
                onChange={handleInputChange}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500"
              />
            </div>

            {formData.requireFollow && (
              <div className="ml-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username to Follow
                </label>
                <input
                  type="text"
                  name="followUsername"
                  value={formData.followUsername}
                  onChange={handleInputChange}
                  placeholder="username"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            <div 
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, requireRecast: !prev.requireRecast }))}
            >
              <div>
                <label className="text-white font-medium cursor-pointer">
                  Require Recast
                </label>
                <p className="text-gray-400 text-sm">
                  Users must recast the original cast
                </p>
              </div>
              <input
                type="checkbox"
                name="requireRecast"
                checked={formData.requireRecast}
                onChange={handleInputChange}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Status</h2>
              <p className="text-gray-400 text-sm mt-1">
                Inactive drops cannot be accessed
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="xl:hidden flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Preview
          </button>
          <Link
            href="/"
            className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? "Updating..." : "Update Drop"}
          </button>
        </div>
      </form>
        </div>
        
        {/* Preview Column - Always visible on desktop */}
        <div className="order-1 xl:order-2">
          <div className="sticky top-8">
            <DropPreview
              poapEventId={formData.poapEventId}
              buttonColor={formData.buttonColor}
              backgroundColor={formData.backgroundColor}
              logoUrl={formData.logoUrl}
              mintMessage={formData.mintMessage}
              disclaimerMessage={formData.disclaimerMessage}
              requireFollow={formData.requireFollow}
              followUsername={formData.followUsername}
              requireRecast={formData.requireRecast}
            />
          </div>
        </div>
      </div>
      
      {/* Preview Modal - Only for mobile */}
      {showPreview && (
        <div className="xl:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-semibold text-white">Drop Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <DropPreview
                poapEventId={formData.poapEventId}
                buttonColor={formData.buttonColor}
                backgroundColor={formData.backgroundColor}
                logoUrl={formData.logoUrl}
                mintMessage={formData.mintMessage}
                disclaimerMessage={formData.disclaimerMessage}
                requireFollow={formData.requireFollow}
                followUsername={formData.followUsername}
                requireRecast={formData.requireRecast}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}