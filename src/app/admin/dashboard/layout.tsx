'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated && data.user) {
            setUser(data.user);
            // Check if user has admin access (email ends with @poap.fr)
            if (data.user.email && data.user.email.endsWith('@poap.fr')) {
              setHasAccess(true);
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navigation = [
    { name: 'Projects', href: '/admin/dashboard' },
    { name: 'Users', href: '/admin/dashboard/users' },
    { name: 'Collectors', href: '/admin/dashboard/collectors' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show access denied message if user doesn't have @poap.fr email
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
            <Image
              src="/poap-studio-logo.png"
              alt="POAP Studio"
              width={120}
              height={120}
              className="mx-auto mb-6 invert"
            />
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-2">
              This area is restricted to POAP team members.
            </p>
            {user && (
              <p className="text-sm text-gray-500 mb-6">
                You are signed in as: {user.email || user.username}
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              {user && (
                <button
                  onClick={handleSignOut}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Image
                src="/poap-studio-logo.png"
                alt="POAP Studio"
                width={40}
                height={40}
                className="mr-4 invert"
              />
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href === '/admin/dashboard' && pathname === '/admin/dashboard');
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      } transition-colors`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-slate-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <div className="py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}