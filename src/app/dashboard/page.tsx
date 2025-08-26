"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfile } from "@farcaster/auth-kit";
import Link from "next/link";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import PlatformSelector from "~/components/PlatformSelector";
import EmailPreviewModal from "~/components/EmailPreviewModal";
import PlatformSelectorModal from "~/components/PlatformSelectorModal";
import CardSkeleton from "~/components/dashboard/CardSkeleton";
import { useRealtimeStatsSSE } from "~/hooks/useRealtimeStats";

interface SessionData {
  userId: string;
  fid?: number;
  googleId?: string;
  email?: string;
  username: string;
  displayName?: string;
  profileImage?: string;
  pfpUrl?: string;
  provider: 'farcaster' | 'google';
}

interface Drop {
  id: string;
  slug: string;
  poapEventId: string;
  poapSecretCode: string;
  buttonColor: string;
  backgroundColor: string;
  logoUrl?: string;
  mintMessage: string;
  disclaimerMessage: string;
  requireFollow: boolean;
  followUsername?: string;
  requireRecast: boolean;
  requireQuote: boolean;
  isActive: boolean;
  createdAt: string;
  platform: string;
  lumaEventId?: string;
  deliveryMethod?: string;
  deliveryTarget?: string;
  lumaEventUrl?: string;
  poapName?: string;
  emailSubject?: string;
  emailBody?: string;
  poapsDelivered?: boolean;
  deliveredAt?: string;
  _count?: {
    claims: number;
    lumaDeliveries?: number;
    instagramDeliveries?: number;
  };
  poapStats?: {
    total: number;
    claimed: number;
    available: number;
  };
  poapEventData?: {
    expiry_date: string;
  };
  lumaEventData?: {
    start_at: string;
    end_at: string;
  };
  lumaGuestStats?: {
    total: number;
    checkedIn: number;
  };
  instagramStoryId?: string;
  instagramStoryUrl?: string;
  instagramStats?: {
    collectors: number;
    interactions: number;
  };
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dropName: string;
}

const DeleteModal = ({ isOpen, onClose, onConfirm, dropName }: DeleteModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete the drop <span className="font-semibold">{dropName}</span>? 
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dropId: string; dropName: string }>({
    isOpen: false,
    dropId: '',
    dropName: ''
  });
  const [sessionUser, setSessionUser] = useState<SessionData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [emailPreviewModal, setEmailPreviewModal] = useState<{ 
    isOpen: boolean; 
    eventName: string;
    emailSubject?: string;
    emailBody?: string;
  }>({
    isOpen: false,
    eventName: '',
    emailSubject: undefined,
    emailBody: undefined
  });
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 9;
  
  // Use real-time stats
  const dropIds = drops.map(d => d.id);
  const { statsUpdates } = useRealtimeStatsSSE(dropIds);

  const fetchDrops = useCallback(async (uid: string) => {
    try {
      const response = await fetch("/api/drops", {
        headers: { "x-user-id": uid },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Fetch POAP names and stats for each drop
        const dropsWithDetails = await Promise.all(
          data.drops.map(async (drop: Drop) => {
            let poapName = null;
            let poapStats = null;
            let poapEventData = null;
            
            try {
              // Fetch POAP name and event data
              const poapResponse = await fetch(`/api/poap/validate-event?eventId=${drop.poapEventId}`);
              if (poapResponse.ok) {
                const poapData = await poapResponse.json();
                poapName = poapData.event?.name || null;
                poapEventData = {
                  expiry_date: poapData.event?.expiry_date || null
                };
              }
            } catch (error) {
              console.error(`Error fetching POAP name for event ${drop.poapEventId}:`, error);
            }
            
            try {
              // Fetch POAP stats
              const statsResponse = await fetch(`/api/poap/stats?eventId=${drop.poapEventId}&secretCode=${encodeURIComponent(drop.poapSecretCode)}`);
              if (statsResponse.ok) {
                poapStats = await statsResponse.json();
              }
            } catch (error) {
              console.error(`Error fetching POAP stats for event ${drop.poapEventId}:`, error);
            }
            
            // For Luma drops, fetch event data and guest stats
            let lumaEventData = null;
            let lumaGuestStats = null;
            
            if (drop.platform === 'luma' && drop.lumaEventId) {
              try {
                const lumaResponse = await fetch('/api/luma/validate-event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ eventId: drop.lumaEventId })
                });
                
                if (lumaResponse.ok) {
                  const lumaData = await lumaResponse.json();
                  lumaEventData = {
                    start_at: lumaData.event.start_at,
                    end_at: lumaData.event.end_at
                  };
                  
                  if (lumaData.event.guestStats) {
                    lumaGuestStats = {
                      total: lumaData.event.guestStats.total,
                      checkedIn: lumaData.event.guestStats.checkedIn
                    };
                  }
                }
              } catch (error) {
                console.error(`Error fetching Luma data for event ${drop.lumaEventId}:`, error);
              }
            }
            
            return { ...drop, poapName, poapStats, poapEventData, lumaEventData, lumaGuestStats };
          })
        );
        setDrops(dropsWithDetails);
        
        // Sync Luma guests in the background
        const lumaDropIds = data.drops
          .filter((d: Drop) => d.platform === 'luma' && d.lumaEventId)
          .map((d: Drop) => d.id);
        
        if (lumaDropIds.length > 0) {
          fetch('/api/drops/sync-luma-guests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dropIds: lumaDropIds })
          }).catch(error => {
            console.error('Error syncing Luma guests:', error);
          });
        }
      }
    } catch (error) {
      console.error("Fetch drops error:", error);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  // Check server session first
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId && !(e.target as HTMLElement).closest('.relative')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setSessionUser(data.user);
            setUserId(data.user.userId);
            fetchDrops(data.user.userId);
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/login');
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [router, fetchDrops]);

  // Sync with Farcaster profile if authenticated
  useEffect(() => {
    const syncWithFarcaster = async () => {
      // Only sync if authenticated with Farcaster and we don't have session data yet
      if (isAuthenticated && profile && !sessionUser && profile.fid && profile.username) {
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
            setSessionUser({
              userId: data.user.id,
              fid: data.user.fid,
              username: data.user.username,
              displayName: data.user.displayName,
              profileImage: data.user.profileImage,
              provider: data.user.provider || 'farcaster',
            });
            fetchDrops(data.user.id);
          }
        } catch (error) {
          console.error("Login error:", error);
        }
      }
    };
    
    syncWithFarcaster();
  }, [isAuthenticated, profile, fetchDrops, sessionUser]);

  const handleDelete = async () => {
    if (!userId || !deleteModal.dropId) return;

    try {
      const response = await fetch(`/api/drops/${deleteModal.dropId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      if (response.ok) {
        setDrops(drops.filter(d => d.id !== deleteModal.dropId));
        toast.success('Drop deleted successfully');
        setDeleteModal({ isOpen: false, dropId: '', dropName: '' });
      } else {
        toast.error('Failed to delete drop');
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error('Failed to delete drop');
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const copyLink = (dropId: string) => {
    const url = `${window.location.origin}/share/${dropId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const downloadCollectors = async (dropId: string, dropName: string) => {
    try {
      const response = await fetch(`/api/download?dropId=${dropId}`);
      
      if (!response.ok) {
        toast.error('Failed to download collectors');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `collectors-${dropName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading collectors:', error);
      toast.error('Failed to download collectors');
    }
  };

  const downloadLumaGuests = async (dropId: string, type: 'all' | 'checkedin') => {
    try {
      const response = await fetch(`/api/drops/${dropId}/download-guests?type=${type}`);
      
      if (!response.ok) {
        toast.error('Failed to download guest list');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `luma-guests-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Guest list downloaded successfully');
    } catch (error) {
      console.error('Error downloading guests:', error);
      toast.error('Failed to download guest list');
    }
  };
  
  const downloadInstagramData = async (dropId: string, type: 'collectors' | 'interactions', dropName: string) => {
    try {
      const response = await fetch(`/api/download?dropId=${dropId}&type=${type}`);
      
      if (!response.ok) {
        toast.error(`Failed to download ${type}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `instagram-${type}-${dropName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type === 'collectors' ? 'Collectors' : 'Interactions'} downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading Instagram ${type}:`, error);
      toast.error(`Failed to download ${type}`);
    }
  };
  
  // Pagination logic
  const totalPages = Math.ceil(drops.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDrops = drops.slice(startIndex, endIndex);

  if (checkingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!sessionUser && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  // Normalize profile data structure
  // Use session data if available, as it's more reliable for persistent sessions
  const displayProfile = sessionUser || (profile ? {
    username: profile.username,
    displayName: profile.displayName,
    profileImage: profile.pfpUrl
  } : null);

  return (
    <>
      <Toaster position="top-center" />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, dropId: '', dropName: '' })}
        onConfirm={handleDelete}
        dropName={deleteModal.dropName}
      />
      <EmailPreviewModal
        isOpen={emailPreviewModal.isOpen}
        onClose={() => setEmailPreviewModal({ 
          isOpen: false, 
          eventName: '',
          emailSubject: undefined,
          emailBody: undefined
        })}
        eventName={emailPreviewModal.eventName}
        emailSubject={emailPreviewModal.emailSubject}
        emailMessage={emailPreviewModal.emailBody}
      />
      <div className="min-h-screen bg-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {displayProfile?.profileImage && (
                <img
                  src={displayProfile.profileImage}
                  alt={displayProfile.username || ''}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome, {displayProfile?.displayName || displayProfile?.username || 'User'}!
                </h1>
                <p className="text-gray-400">Manage your POAP drops</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
              {drops.length > 0 && <PlatformSelector />}
            </div>
          </div>
        </div>

      {/* Drops Grid */}
      {initialLoad ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : drops.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            No drops yet
          </h2>
          <p className="text-gray-400 mb-6">
            Create your first POAP drop to get started
          </p>
          <button
            onClick={() => setShowPlatformModal(true)}
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Create Drop
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDrops.map((drop) => (
              <div
                key={drop.id}
                className="bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-200 flex flex-col h-[420px]"
              >
                {/* Color Preview Bar */}
                <div
                  className="h-3"
                  style={{ 
                    backgroundColor: drop.platform === 'luma' ? "#000000" : 
                                   drop.platform === 'instagram' ? "#E4405F" : 
                                   "#8b5cf6" 
                  }}
                />
                
                <div className="p-6 flex flex-col flex-1">
                  {/* Top row with platform icon and status chip */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${
                        drop.platform === 'luma' ? 'bg-pink-500/20' : 
                        drop.platform === 'instagram' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' :
                        'bg-white/10'
                      } backdrop-blur-sm flex items-center justify-center`}>
                        {drop.platform === 'luma' ? (
                          <Image 
                            src="/icons/luma.svg" 
                            alt="Luma" 
                            width={20} 
                            height={20}
                            className="w-5 h-5"
                          />
                        ) : drop.platform === 'instagram' ? (
                          <Image 
                            src="/icons/instagram.png" 
                            alt="Instagram" 
                            width={20} 
                            height={20}
                            className="w-5 h-5"
                          />
                        ) : (
                          <Image 
                            src="/icons/farcaster.png" 
                            alt="Farcaster" 
                            width={20} 
                            height={20}
                            className="w-5 h-5"
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {drop.platform === 'luma' ? 'Luma' : drop.platform === 'instagram' ? 'Instagram' : 'Farcaster'}
                      </span>
                    </div>
                    {drop.platform === 'luma' && drop.lumaEventData ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          drop.poapsDelivered
                            ? "bg-purple-900 text-purple-300"
                            : new Date(drop.lumaEventData.end_at) < new Date()
                            ? "bg-gray-900 text-gray-300"
                            : "bg-green-900 text-green-300"
                        }`}
                      >
                        {drop.poapsDelivered
                          ? "POAPs Delivered"
                          : new Date(drop.lumaEventData.end_at) < new Date()
                          ? "Event Ended"
                          : "Active"}
                      </span>
                    ) : drop.platform === 'farcaster' && drop.poapEventData?.expiry_date ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          new Date(drop.poapEventData.expiry_date) < new Date()
                            ? "bg-gray-900 text-gray-300"
                            : drop.poapStats && drop.poapStats.available === 0
                            ? "bg-red-900 text-red-300"
                            : "bg-green-900 text-green-300"
                        }`}
                      >
                        {new Date(drop.poapEventData.expiry_date) < new Date()
                          ? "Event Ended"
                          : drop.poapStats && drop.poapStats.available === 0
                          ? "No POAPs"
                          : "Active"}
                      </span>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          drop.isActive
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {drop.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>
                  
                  {/* Title on its own line */}
                  <h3 className="text-lg font-semibold text-white truncate mb-4">
                    {drop.poapName || `Event #${drop.poapEventId}`}
                  </h3>

                  {/* Instagram Story Thumbnail */}
                  {drop.platform === 'instagram' && drop.instagramStoryUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-slate-700/50">
                      <img
                        src={drop.instagramStoryUrl}
                        alt="Instagram Story"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(drop.createdAt).toLocaleDateString()}
                      </p>
                      {drop.platform === 'luma' && drop.lumaEventData && (
                        <>
                          <p className="text-gray-400 text-sm">
                            POAPs will be delivered on: {new Date(drop.lumaEventData.end_at).toLocaleDateString()} at {new Date(drop.lumaEventData.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Delivery: {drop.deliveryTarget === 'ethereum' ? 'ETH Address' : 'Email'}
                          </p>
                        </>
                      )}
                      {drop.platform === 'farcaster' && drop.poapEventData?.expiry_date && (
                        <p className="text-gray-400 text-sm">
                          POAP expires: {new Date(drop.poapEventData.expiry_date).toLocaleDateString()} at {new Date(drop.poapEventData.expiry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
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
                      {drop.platform === 'luma' ? (
                        <div className="space-y-1">
                          {drop.lumaGuestStats && (
                            <>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  downloadLumaGuests(drop.id, 'checkedin');
                                }}
                                className="block text-blue-400 hover:text-blue-300 text-sm underline"
                              >
                                {drop.lumaGuestStats.checkedIn} checked-in guests
                              </a>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  downloadLumaGuests(drop.id, 'all');
                                }}
                                className="block text-gray-400 hover:text-gray-300 text-sm underline"
                              >
                                {drop.lumaGuestStats.total} total registered
                              </a>
                            </>
                          )}
                        </div>
                      ) : drop.platform === 'instagram' ? (
                        <div className="space-y-1">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              downloadInstagramData(drop.id, 'collectors', drop.poapName || `Event #${drop.poapEventId}`);
                            }}
                            className="block text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            {statsUpdates[drop.id]?.instagramStats?.collectors ?? drop.instagramStats?.collectors ?? 0} collectors
                          </a>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              downloadInstagramData(drop.id, 'interactions', drop.poapName || `Event #${drop.poapEventId}`);
                            }}
                            className="block text-gray-400 hover:text-gray-300 text-sm underline"
                          >
                            {statsUpdates[drop.id]?.instagramStats?.interactions ?? drop.instagramStats?.interactions ?? 0} total interactions
                          </a>
                        </div>
                      ) : (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            downloadCollectors(drop.id, drop.poapName || `Event #${drop.poapEventId}`);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                        >
                          {statsUpdates[drop.id]?.claims ?? drop._count?.claims ?? 0} collectors
                        </a>
                      )}
                      {drop.poapStats && (
                        <>
                          <p className="text-gray-400 text-sm">
                            POAPs available: <span className="text-white font-medium">{drop.poapStats.available}</span>
                          </p>
                          {drop.platform === 'luma' && drop.lumaGuestStats && drop.poapStats.available < drop.lumaGuestStats.checkedIn && (
                            <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-lg">
                              <p className="text-red-400 text-xs">
                                ⚠️ Not enough POAPs! You need {drop.lumaGuestStats.checkedIn - drop.poapStats.available} more mint links.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    {drop.platform === 'luma' && drop.deliveryTarget !== 'ethereum' ? (
                      <button
                        onClick={() => setEmailPreviewModal({ 
                          isOpen: true, 
                          eventName: drop.poapName || `Event #${drop.poapEventId}`,
                          emailSubject: drop.emailSubject,
                          emailBody: drop.emailBody
                        })}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-12 sm:h-10 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                      >
                        Preview Email
                      </button>
                    ) : drop.platform === 'farcaster' ? (
                      <button
                        onClick={() => copyLink(drop.id)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-12 sm:h-10 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                      >
                        Copy Link
                      </button>
                    ) : drop.platform === 'instagram' ? (
                      <div className="relative flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === drop.id ? null : drop.id);
                          }}
                          className="w-full bg-slate-700 hover:bg-slate-600 text-white h-12 sm:h-10 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          Download
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openDropdownId === drop.id && (
                          <div className="absolute bottom-full mb-1 left-0 right-0 bg-slate-700 rounded-lg shadow-lg overflow-hidden z-10">
                            <button
                              onClick={() => {
                                downloadInstagramData(drop.id, 'collectors', drop.poapName || `Event #${drop.poapEventId}`);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                            >
                              Download collectors
                            </button>
                            <button
                              onClick={() => {
                                downloadInstagramData(drop.id, 'interactions', drop.poapName || `Event #${drop.poapEventId}`);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                            >
                              Download all interactions
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                    <Link
                      href={
                        drop.platform === 'luma' ? `/dashboard/drops/luma/${drop.id}/edit` : 
                        drop.platform === 'instagram' ? `/dashboard/drops/instagram/${drop.id}/edit` :
                        `/drops/${drop.id}/edit`
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 sm:h-10 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ 
                        isOpen: true, 
                        dropId: drop.id, 
                        dropName: drop.poapName || `Event #${drop.poapEventId}` 
                      })}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12 sm:h-10 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white transition-colors"
              >
                ←
              </button>
              
              {/* Mobile: show current/total */}
              <span className="text-gray-400 sm:hidden">
                {currentPage} / {totalPages}
              </span>
              
              {/* Desktop: show page numbers */}
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white transition-colors"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
      </div>
      </div>
      
      {/* Platform Selector Modal */}
      <PlatformSelectorModal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
      />
    </>
  );
}