'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface Drop {
  id: string;
  slug: string;
  platform: 'farcaster' | 'luma' | 'instagram';
  poapEventId: string;
  isActive: boolean;
  createdAt: string;
  lumaEventUrl?: string;
  instagramStoryUrl?: string;
  user: {
    email?: string;
    username: string;
    provider: string;
  };
  _count?: {
    claims?: number;
    lumaDeliveries?: number;
    instagramDeliveries?: number;
  };
}

export default function AdminProjectsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    platform: '',
    user: '',
  });
  const [poapData, setPoapData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchDrops();
  }, [filters]);

  const fetchDrops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.user) params.append('user', filters.user);

      const response = await fetch(`/api/admin/drops?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDrops(data.drops);
        
        // Fetch POAP data for each drop
        const poapPromises = data.drops.map(async (drop: Drop) => {
          try {
            const res = await fetch(`/api/poap/validate-event?eventId=${drop.poapEventId}`);
            const poapInfo = await res.json();
            return { id: drop.id, poap: poapInfo.event };
          } catch {
            return { id: drop.id, poap: null };
          }
        });
        
        const poapResults = await Promise.all(poapPromises);
        const poapMap = poapResults.reduce((acc, { id, poap }) => ({
          ...acc,
          [id]: poap
        }), {});
        setPoapData(poapMap);
      }
    } catch (error) {
      toast.error('Failed to fetch drops');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dropId: string) => {
    if (!confirm('Are you sure you want to delete this drop?')) return;

    try {
      const response = await fetch(`/api/admin/drops/${dropId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Drop deleted successfully');
        fetchDrops();
      } else {
        toast.error('Failed to delete drop');
      }
    } catch (error) {
      toast.error('Failed to delete drop');
    }
  };

  const handleToggleActive = async (dropId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/drops/${dropId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Drop ${isActive ? 'deactivated' : 'activated'} successfully`);
        fetchDrops();
      }
    } catch (error) {
      toast.error('Failed to update drop status');
    }
  };

  const getCollectorCount = (drop: Drop) => {
    if (drop.platform === 'farcaster') return drop._count?.claims || 0;
    if (drop.platform === 'luma') return drop._count?.lumaDeliveries || 0;
    if (drop.platform === 'instagram') return drop._count?.instagramDeliveries || 0;
    return 0;
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'farcaster') return '/icons/farcaster.svg';
    if (platform === 'luma') return '/icons/luma.svg';
    if (platform === 'instagram') return '/icons/instagram.svg';
    return '/logo.png';
  };

  const getPlatformColor = (platform: string) => {
    if (platform === 'farcaster') return 'from-purple-600 to-purple-800';
    if (platform === 'luma') return 'from-pink-600 to-pink-800';
    if (platform === 'instagram') return 'from-orange-600 to-orange-800';
    return 'from-gray-600 to-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Projects</h1>
        
        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Platform
            </label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
            >
              <option value="">All Platforms</option>
              <option value="farcaster">Farcaster</option>
              <option value="luma">Luma</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              User
            </label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              placeholder="Email or username"
              className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Drops Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No drops found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drops.map((drop) => {
            const poap = poapData[drop.id];
            const collectors = getCollectorCount(drop);
            
            return (
              <div
                key={drop.id}
                className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${getPlatformColor(drop.platform)}`} />
                
                <div className="p-6">
                  {/* Platform & Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src={getPlatformIcon(drop.platform)}
                        alt={drop.platform}
                        width={24}
                        height={24}
                      />
                      <span className="text-sm font-medium text-gray-300 capitalize">
                        {drop.platform}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        drop.isActive
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {drop.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* POAP Info */}
                  {poap && (
                    <div className="mb-4 flex items-center gap-4">
                      <Image
                        src={poap.image_url}
                        alt={poap.name}
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">
                          {poap.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Event #{drop.poapEventId}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="mb-4 text-sm">
                    <p className="text-gray-400">Created by:</p>
                    <p className="text-white">
                      {drop.user.email || drop.user.username}
                      <span className="text-gray-500 text-xs ml-1">
                        ({drop.user.provider})
                      </span>
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="mb-4 text-sm">
                    <p className="text-gray-400">Collectors:</p>
                    <p className="text-2xl font-bold text-white">{collectors}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/drops/${drop.id}/edit`}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-3 rounded-lg text-center transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleActive(drop.id, drop.isActive)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      {drop.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(drop.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}