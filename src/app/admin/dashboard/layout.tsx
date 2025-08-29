'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

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
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/admin' })}
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