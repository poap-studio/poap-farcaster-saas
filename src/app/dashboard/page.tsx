"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfile } from "@farcaster/auth-kit";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SessionData {
  userId: string;
  fid: number;
  username: string;
  displayName?: string;
  profileImage?: string;
  pfpUrl?: string;
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
  isActive: boolean;
  createdAt: string;
  poapName?: string;
  _count?: {
    claims: number;
  };
  poapStats?: {
    total: number;
    claimed: number;
    available: number;
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
        <h3 className="text-xl font-semibold text-white mb-4">Confirmar eliminación</h3>
        <p className="text-gray-300 mb-6">
          ¿Estás seguro que quieres eliminar el drop <span className="font-semibold">{dropName}</span>? 
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Eliminar
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
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dropId: string; dropName: string }>({
    isOpen: false,
    dropId: '',
    dropName: ''
  });
  const [sessionUser, setSessionUser] = useState<SessionData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const ITEMS_PER_PAGE = 9;

  const fetchDrops = useCallback(async (uid: string) => {
    setLoading(true);
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
            
            try {
              // Fetch POAP name
              const poapResponse = await fetch(`/api/poap/validate-event?eventId=${drop.poapEventId}`);
              if (poapResponse.ok) {
                const poapData = await poapResponse.json();
                poapName = poapData.event?.name || null;
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
            
            return { ...drop, poapName, poapStats };
          })
        );
        setDrops(dropsWithDetails);
      }
    } catch (error) {
      console.error("Fetch drops error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check server session first
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
        toast.success('Drop eliminado correctamente');
        setDeleteModal({ isOpen: false, dropId: '', dropName: '' });
      } else {
        toast.error('Error al eliminar el drop');
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error('Error al eliminar el drop');
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
    toast.success('Enlace copiado al portapapeles');
  };

  const downloadCollectors = async (dropId: string, dropName: string) => {
    try {
      const response = await fetch(`/api/download?dropId=${dropId}`);
      
      if (!response.ok) {
        toast.error('Error al descargar los collectors');
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
      
      toast.success('Archivo descargado correctamente');
    } catch (error) {
      console.error('Error downloading collectors:', error);
      toast.error('Error al descargar los collectors');
    }
  };
  
  // Pagination logic
  const totalPages = Math.ceil(drops.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDrops = drops.slice(startIndex, endIndex);

  if (checkingSession || loading) {
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
              <Link
                href="/drops/new"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Create New Drop
              </Link>
            </div>
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
            href="/drops/new"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Create Drop
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDrops.map((drop) => (
              <div
                key={drop.id}
                className="bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-200 flex flex-col h-[320px]"
              >
                {/* Color Preview Bar */}
                <div
                  className="h-2"
                  style={{ backgroundColor: drop.buttonColor }}
                />
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white truncate pr-2">
                      {drop.poapName || `Event #${drop.poapEventId}`}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        drop.isActive
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {drop.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex-1">
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
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          downloadCollectors(drop.id, drop.poapName || `Event #${drop.poapEventId}`);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        {drop._count?.claims || 0} collectors
                      </a>
                      {drop.poapStats && (
                        <p className="text-gray-400 text-sm">
                          Minted: <span className="text-white font-medium">{drop.poapStats.claimed}/{drop.poapStats.total}</span>
                          {drop.poapStats.available === 0 && (
                            <span className="text-red-400 ml-2">(No POAPs left)</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <button
                      onClick={() => copyLink(drop.id)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-10 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center"
                    >
                      Copy Link
                    </button>
                    <Link
                      href={`/drops/${drop.id}/edit`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ 
                        isOpen: true, 
                        dropId: drop.id, 
                        dropName: drop.poapName || `Event #${drop.poapEventId}` 
                      })}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white h-10 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center"
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
    </>
  );
}