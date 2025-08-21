"use client";

import { useEffect, useState } from "react";
import { SignInButton, useProfile } from "@farcaster/auth-kit";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import styles from "../admin.module.css";

export default function LoginPage() {
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Check if Google OAuth is configured
  const isGoogleOAuthConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  useEffect(() => {
    console.log('Login Page mounted');
    console.log('Google OAuth configured:', isGoogleOAuthConfigured);
    console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID exists:', !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  }, [isGoogleOAuthConfigured]);

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

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        console.error('Failed to create Google session');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 bg-slate-900 ${styles.adminLogin}`}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Login
        </h1>
        <p className="text-gray-300 mb-8 text-center">
          Choose your preferred method to sign in
        </p>
        <div className="space-y-4">
          <div className="flex justify-center">
            <SignInButton />
          </div>
          {isGoogleOAuthConfigured ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-gray-400">or</span>
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.log('Google Login Failed');
                  }}
                  text="continue_with"
                  shape="pill"
                  theme="filled_blue"
                  size="large"
                />
              </div>
            </>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Google OAuth not configured</p>
              <p className="text-xs mt-1">Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}