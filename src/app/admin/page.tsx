'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Image
              src="/poap-studio-logo.png"
              alt="POAP Studio"
              width={120}
              height={120}
              className="mx-auto mb-4 invert"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Access restricted to @poap.fr emails</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <div className="text-sm text-center text-gray-400 mt-4">
              <p>Only emails ending with @poap.fr can access this panel</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <Link
                href="/admin/dashboard"
                className="block w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
              >
                Go to Admin Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}