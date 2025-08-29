'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface POAPGroup {
  poapEventId: string;
  poapData?: {
    name: string;
    image_url: string;
    description?: string;
  };
  totalCollectors: number;
  platforms: {
    farcaster: number;
    luma: number;
    instagram: number;
  };
}

const ITEMS_PER_PAGE = 12;

export default function POAPCollectors() {
  const [poapGroups, setPoapGroups] = useState<POAPGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const lastPoapRef = useRef<HTMLDivElement>(null);

  const fetchPOAPGroups = useCallback(async (pageNum: number, searchQuery: string) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', pageNum.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/admin/collectors/poaps?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Fetch POAP data for each group
        const poapPromises = data.groups.map(async (group: POAPGroup) => {
          try {
            const res = await fetch(`/api/poap/validate-event?eventId=${group.poapEventId}`);
            const poapInfo = await res.json();
            return { ...group, poapData: poapInfo.event };
          } catch {
            return group;
          }
        });
        
        const groupsWithPoap = await Promise.all(poapPromises);
        
        if (pageNum === 1) {
          setPoapGroups(groupsWithPoap);
        } else {
          setPoapGroups(prev => [...prev, ...groupsWithPoap]);
        }
        
        setHasMore(data.groups.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Failed to fetch POAP groups:', error);
      toast.error('Failed to load POAPs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setPoapGroups([]);
    fetchPOAPGroups(1, search);
  }, [search, fetchPOAPGroups]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const callback = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    };

    observer.current = new IntersectionObserver(callback);
    
    if (lastPoapRef.current) {
      observer.current.observe(lastPoapRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    if (page > 1) {
      fetchPOAPGroups(page, search);
    }
  }, [page, search, fetchPOAPGroups]);

  const handleDownload = async (poapEventId: string, poapName: string) => {
    setDownloading(poapEventId);
    
    try {
      const response = await fetch(`/api/admin/collectors/poaps/${poapEventId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download collectors');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `collectors-${poapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${poapEventId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Collectors downloaded successfully');
    } catch (error) {
      console.error('Failed to download collectors:', error);
      toast.error('Failed to download collectors');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by POAP name or event ID"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
        />
      </div>

      {/* POAP Groups */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : poapGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No POAPs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {poapGroups.map((group, index) => (
            <div
              key={group.poapEventId}
              ref={index === poapGroups.length - 1 ? lastPoapRef : null}
              className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              {/* POAP Info */}
              <div className="p-6">
                {group.poapData ? (
                  <div className="flex items-start gap-4 mb-4">
                    <Image
                      src={group.poapData.image_url}
                      alt={group.poapData.name}
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">
                        {group.poapData.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Event #{group.poapEventId}
                      </p>
                      {group.poapData.description && (
                        <p className="text-xs text-gray-300 mt-2 line-clamp-2">
                          {group.poapData.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h3 className="font-semibold text-white text-lg">
                      POAP #{group.poapEventId}
                    </h3>
                  </div>
                )}

                {/* Collectors Stats */}
                <div className="bg-slate-700 rounded-lg p-4 mb-4">
                  <div className="mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Total Collectors</span>
                      <span className="text-2xl font-bold text-white">{group.totalCollectors}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-purple-400 font-medium">{group.platforms.farcaster}</div>
                      <div className="text-gray-500 text-xs">Farcaster</div>
                    </div>
                    <div className="text-center">
                      <div className="text-pink-400 font-medium">{group.platforms.luma}</div>
                      <div className="text-gray-500 text-xs">Luma</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-400 font-medium">{group.platforms.instagram}</div>
                      <div className="text-gray-500 text-xs">Instagram</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={`https://poap.gallery/drops/${group.poapEventId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-3 rounded-lg text-center transition-colors"
                  >
                    View on POAP
                  </a>
                  <button
                    onClick={() => handleDownload(group.poapEventId, group.poapData?.name || `poap-${group.poapEventId}`)}
                    disabled={downloading === group.poapEventId}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading === group.poapEventId ? 'Downloading...' : 'Download CSV'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* No more items message */}
      {!hasMore && poapGroups.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          No more POAPs to load
        </div>
      )}
    </div>
  );
}