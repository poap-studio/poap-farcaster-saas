'use client';

import { useState } from 'react';
import InstagramCollectors from '~/components/admin/InstagramCollectors';
import LumaCollectors from '~/components/admin/LumaCollectors';
import FarcasterCollectors from '~/components/admin/FarcasterCollectors';
import POAPCollectors from '~/components/admin/POAPCollectors';

export default function AdminCollectorsPage() {
  const [activeTab, setActiveTab] = useState<'instagram' | 'luma' | 'farcaster' | 'poaps'>('instagram');

  const tabs = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'luma', label: 'Luma' },
    { id: 'farcaster', label: 'Farcaster' },
    { id: 'poaps', label: 'POAPs' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Collectors</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'instagram' | 'luma' | 'farcaster' | 'poaps')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'instagram' && <InstagramCollectors />}
        {activeTab === 'luma' && <LumaCollectors />}
        {activeTab === 'farcaster' && <FarcasterCollectors />}
        {activeTab === 'poaps' && <POAPCollectors />}
      </div>
    </div>
  );
}