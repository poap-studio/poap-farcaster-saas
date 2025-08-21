"use client";

import { useEffect } from "react";
import { SignInButton, useProfile } from "@farcaster/auth-kit";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export default function HomePage() {
  const { isAuthenticated } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 bg-slate-900 ${styles.adminLogin}`}>
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