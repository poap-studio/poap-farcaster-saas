"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Platform {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
}

const platforms: Platform[] = [
  {
    id: "farcaster",
    name: "Farcaster",
    icon: "⟠",
    href: "/dashboard/drops/new",
    color: "bg-purple-600 hover:bg-purple-700"
  },
  {
    id: "luma",
    name: "Luma",
    icon: "🌟",
    href: "/dashboard/drops/luma/new",
    color: "bg-pink-600 hover:bg-pink-700"
  }
];

export default function PlatformSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center gap-2"
      >
        Create New Drop
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-slate-800 border border-slate-700 overflow-hidden z-10">
          <div className="py-1">
            {platforms.map((platform) => (
              <Link
                key={platform.id}
                href={platform.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors duration-150"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <div className="text-white font-medium">{platform.name}</div>
                  <div className="text-gray-400 text-sm">Create {platform.name} drop</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}