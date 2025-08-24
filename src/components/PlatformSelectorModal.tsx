"use client";

import Link from "next/link";
import Image from "next/image";

interface PlatformSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformSelectorModal({ isOpen, onClose }: PlatformSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Select Platform
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Choose where you want to distribute your POAPs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Farcaster Option */}
          <Link
            href="/dashboard/drops/farcaster/new"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 rounded-xl p-6 transition-all duration-200 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <Image 
                  src="/icons/farcaster.png" 
                  alt="Farcaster" 
                  width={48} 
                  height={48}
                  className="w-12 h-12"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Farcaster</h3>
              <p className="text-gray-400 text-sm">
                Distribute POAPs through Farcaster frames with social requirements
              </p>
            </div>
          </Link>

          {/* Luma Option */}
          <Link
            href="/dashboard/drops/luma/new"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 rounded-xl p-6 transition-all duration-200 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-pink-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-4">
                <Image 
                  src="/icons/luma.svg" 
                  alt="Luma" 
                  width={48} 
                  height={48}
                  className="w-12 h-12"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Luma</h3>
              <p className="text-gray-400 text-sm">
                Send POAPs to attendees of your Luma events automatically
              </p>
            </div>
          </Link>

          {/* Instagram Option */}
          <Link
            href="/dashboard/drops/instagram/new"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 rounded-xl p-6 transition-all duration-200 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-pink-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
                <Image 
                  src="/icons/instagram.png" 
                  alt="Instagram" 
                  width={48} 
                  height={48}
                  className="w-12 h-12"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instagram</h3>
              <p className="text-gray-400 text-sm">
                Send POAPs to users who reply to your Instagram stories
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}