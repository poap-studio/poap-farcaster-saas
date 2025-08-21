"use client";

import { useEffect, useState } from "react";
import { SignInButton, useProfile } from "@farcaster/auth-kit";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export default function LoginPage() {
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const handleLogin = async () => {
      if (isAuthenticated && profile && !isLoggingIn) {
        setIsLoggingIn(true);
        try {
          // Create session on server
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
            // Redirect to dashboard after session is created
            router.push('/dashboard');
          } else {
            console.error('Failed to create session');
            setIsLoggingIn(false);
          }
        } catch (error) {
          console.error('Login error:', error);
          setIsLoggingIn(false);
        }
      }
    };

    handleLogin();
  }, [isAuthenticated, profile, router, isLoggingIn]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();
  }, [router]);

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