"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FramePreview from "~/components/landing/FramePreview";
import SocialBubbles from "~/components/landing/SocialBubbles";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check for existing session
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/request-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setEmail("");
      } else {
        alert('Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Drop POAPs on Farcaster
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Collect Ethereum addresses from your fans and develop engagement policies that matter. 
                Turn social interactions into valuable Web3 connections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Link
                  href="/login"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Create Your Drop
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <FramePreview />
            </div>
          </div>
        </div>
      </section>

      {/* Every Drop Every Social Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-900/30 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🎁</span>
              <span className="text-purple-400 font-semibold">Drop</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Every drop, every social app
            </h2>
            <p className="text-xl text-gray-300">
              Currently supporting Farcaster with an architecture designed to expand across all major social platforms. 
              Your POAPs will reach audiences on Telegram, Instagram, Lens, and more - coming soon.
            </p>
          </div>
          <SocialBubbles />
        </div>
      </section>

      {/* No Gas No Complexity Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">
              No gas, no complexity
            </h2>
            <p className="text-xl text-gray-300 text-center mb-12">
              POAPs are collected without users paying any gas fees. Recipients can claim with just their email 
              or Ethereum address, supporting multiple chains including Base, Gnosis Chain, Polygon, Optimism, and more.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">⛽</div>
                <h3 className="text-xl font-semibold mb-2">Zero Gas Fees</h3>
                <p className="text-gray-400">Users claim POAPs without spending any cryptocurrency</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-semibold mb-2">Email or Wallet</h3>
                <p className="text-gray-400">Flexible claiming options for all user types</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold mb-2">Multi-Chain</h3>
                <p className="text-gray-400">Support for all major EVM chains</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Access Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Commercial Access
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              This application is for personal use only. If you need commercial access or represent a protocol 
              or company, please contact us for custom solutions and enterprise features.
            </p>
            {isSubmitted ? (
              <div className="max-w-md mx-auto mb-12 bg-green-900/30 border border-green-700 rounded-lg p-6 text-center">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">Request Sent Successfully!</h3>
                <p className="text-gray-300">We&apos;ll get back to you soon with information about commercial access.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-gray-400 border border-slate-600 focus:border-purple-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    {isSubmitting ? 'Sending...' : 'Request Info'}
                  </button>
                </div>
              </form>
            )}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="text-lg font-semibold mb-1">Engagement Insights</h3>
                <p className="text-gray-400 text-sm">Track and analyze your community interactions</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="text-lg font-semibold mb-1">Fan Data</h3>
                <p className="text-gray-400 text-sm">Build direct relationships with your audience</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💎</div>
                <h3 className="text-lg font-semibold mb-1">Gas-Free Collectibles</h3>
                <p className="text-gray-400 text-sm">Distribute digital memorabilia at scale</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 POAP Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}