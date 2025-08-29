'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface AuthorizedUser {
  id: string;
  email: string;
  username?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  stats?: {
    farcaster: number;
    luma: number;
    instagram: number;
    totalCollectors: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [authMethod, setAuthMethod] = useState<'farcaster' | 'gmail' | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    isAdmin: false,
  });

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Validate based on auth method
    if (authMethod === 'gmail' && !newUser.email) {
      toast.error('Email is required');
      return;
    }
    
    if (authMethod === 'farcaster' && !newUser.username) {
      toast.error('Farcaster username is required');
      return;
    }

    try {
      const payload = {
        email: authMethod === 'gmail' ? newUser.email : '',
        username: authMethod === 'farcaster' ? newUser.username : '',
        isAdmin: newUser.isAdmin,
        authMethod: authMethod,
      };

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User added successfully');
        setShowAddModal(false);
        setAuthMethod(null);
        setNewUser({ email: '', username: '', isAdmin: false });
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to add user');
      }
    } catch (error) {
      toast.error('Failed to add user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });

      if (response.ok) {
        toast.success('Admin status updated successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update admin status');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Authorized Users</h1>
          <button
            onClick={() => {
              setShowAddModal(true);
              setAuthMethod(null);
              setNewUser({ email: '', username: '', isAdmin: false });
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Add New User
          </button>
        </div>
        
        {/* Search */}
        <div className="bg-slate-800 rounded-lg p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or username"
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Farcaster Drops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Luma Drops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Instagram Drops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Collectors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.email}
                      </div>
                      {user.username && (
                        <div className="text-sm text-gray-400">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {user.stats?.farcaster || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {user.stats?.luma || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {user.stats?.instagram || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {user.stats?.totalCollectors || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.isAdmin && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-900/30 text-purple-400">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Add New User</h2>
            
            {!authMethod ? (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm mb-4">Choose authentication method:</p>
                
                {/* Auth Method Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAuthMethod('farcaster')}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-4 transition-all hover:border-purple-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-purple-400" viewBox="0 0 1000 1000" fill="currentColor">
                        <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.542 441.677 589.258 373.333 500 373.333C410.742 373.333 337.458 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
                        <path d="M128.889 253.333L157.778 351.111H182.222V746.667C182.222 777.776 207.111 802.667 238.222 802.667H280V844.444H238.222C183.111 844.444 138.667 800 138.667 744.889V351.111H100L128.889 253.333Z" />
                        <path d="M871.111 253.333L900 351.111H861.333V744.889C861.333 800 816.889 844.444 761.778 844.444H720V802.667H761.778C792.889 802.667 817.778 777.776 817.778 746.667V351.111H842.222L871.111 253.333Z" />
                      </svg>
                      <span className="text-white font-medium">Farcaster</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setAuthMethod('gmail')}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-4 transition-all hover:border-purple-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M22 8.608v8.142a3.25 3.25 0 0 1-3.25 3.25h-5.5V12l-1.25-1L22 8.608Z"/>
                        <path fill="#34A853" d="m22 8.608-10 2.392V20h5.5a3.25 3.25 0 0 0 3.25-3.25V8.608Z"/>
                        <path fill="#FBBC04" d="M12 11v9H5.25A3.25 3.25 0 0 1 2 16.75V11l10-1Z"/>
                        <path fill="#4285F4" d="m2 11 4.666-3.5L12 11l5.334-3.5L22 11V7.25A3.25 3.25 0 0 0 18.75 4h-13.5A3.25 3.25 0 0 0 2 7.25V11Z"/>
                      </svg>
                      <span className="text-white font-medium">Gmail</span>
                    </div>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAuthMethod(null);
                    setNewUser({ email: '', username: '', isAdmin: false });
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setAuthMethod(null)}
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                >
                  ← Back to selection
                </button>
                
                {authMethod === 'farcaster' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Farcaster Username
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                      placeholder="username"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Gmail Address
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                      placeholder="user@gmail.com"
                    />
                  </div>
                )}
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.isAdmin}
                      onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-purple-600"
                    />
                    <span className="text-sm text-gray-300">Admin access</span>
                  </label>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleAddUser}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Add User
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setAuthMethod(null);
                      setNewUser({ email: '', username: '', isAdmin: false });
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}