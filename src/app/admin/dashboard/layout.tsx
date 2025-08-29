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

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated && data.user && data.user.email) {
            // Only allow @poap.fr emails
            if (data.user.email.endsWith('@poap.fr')) {
              setUser(data.user);
              setIsLoading(false);
            } else {
              // Not an admin, redirect to regular login
              router.replace('/login');
            }
          } else {
            // Not authenticated, redirect to admin login
            router.replace('/admin');
          }
        } else {
          router.replace('/admin');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.replace('/admin');
      }
    };

    checkAdminAccess();
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Projects', href: '/admin/dashboard' },
    { name: 'Users', href: '/admin/dashboard/users' },
    { name: 'Collectors', href: '/admin/dashboard/collectors' },
  ];

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
                className="mr-4"
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