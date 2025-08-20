"use client";

import { useState, useEffect, useCallback } from "react";
import { SignInButton, useProfile } from "@farcaster/auth-kit";
import Link from "next/link";

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
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { isAuthenticated, profile } = useProfile();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (!profile) return;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: profile.fid,
          username: profile.username,
          displayName: profile.displayName,
          profileImage: profile.pfpUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
        return data.user.id;
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  }, [profile]);

  const fetchDrops = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/drops", {
        headers: { "x-user-id": uid },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrops(data.drops);
      }
    } catch (error) {
      console.error("Fetch drops error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle login
  useEffect(() => {
    const loginAndFetch = async () => {
      if (isAuthenticated && profile) {
        const uid = await handleLogin();
        if (uid) {
          fetchDrops(uid);
        }
      }
    };
    loginAndFetch();
  }, [isAuthenticated, profile, handleLogin, fetchDrops]);

  const handleDelete = async (dropId: string) => {
    if (!userId || !confirm("Are you sure you want to delete this drop?")) return;

    try {
      const response = await fetch(`/api/drops/${dropId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      if (response.ok) {
        setDrops(drops.filter(d => d.id !== dropId));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const copyLink = (slug: string) => {
    // Use the share endpoint that generates unique URLs
    const url = `${window.location.origin}/share/${slug}`;
    navigator.clipboard.writeText(url);
    alert(`Shareable link copied!\n\n${url}\n\nThis link will generate a unique URL each time it's accessed to prevent cache issues.`);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            POAP Drop Manager
          </h1>
          <p className="text-gray-300 mb-8 text-center">
            Sign in with Farcaster to manage your POAP drops
          </p>
          <div className="flex justify-center">
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {profile?.pfpUrl && (
              <img
                src={profile.pfpUrl}
                alt={profile.username}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome, {profile?.displayName || profile?.username}!
              </h1>
              <p className="text-gray-400">Manage your POAP drops</p>
            </div>
          </div>
          <Link
            href="/admin/drops/new"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Create New Drop
          </Link>
        </div>
      </div>

      {/* Drops Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : drops.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            No drops yet
          </h2>
          <p className="text-gray-400 mb-6">
            Create your first POAP drop to get started
          </p>
          <Link
            href="/admin/drops/new"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Create Drop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drops.map((drop) => (
            <div
              key={drop.id}
              className="bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-200"
            >
              {/* Color Preview Bar */}
              <div
                className="h-2"
                style={{ backgroundColor: drop.buttonColor }}
              />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Event #{drop.poapEventId}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      drop.isActive
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {drop.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-gray-400 text-sm">
                    Created: {new Date(drop.createdAt).toLocaleDateString()}
                  </p>
                  {drop.requireFollow && (
                    <p className="text-gray-400 text-sm">
                      Follow: @{drop.followUsername}
                    </p>
                  )}
                  {drop.requireRecast && (
                    <p className="text-gray-400 text-sm">
                      Recast required
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => copyLink(drop.slug)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Copy Share Link
                  </button>
                  <Link
                    href={`/admin/drops/${drop.id}/edit`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-center text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(drop.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}