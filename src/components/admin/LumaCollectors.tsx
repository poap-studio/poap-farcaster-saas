'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LumaCollector {
  id: string;
  dropId: string;
  name: string;
  email: string;
  sentAt: string;
  drop: {
    poapEventId: string;
    lumaEventUrl?: string;
  };
  guest?: {
    ethAddress?: string;
  };
  poapData?: {
    name: string;
    image_url: string;
  };
}

export default function LumaCollectors() {
  const [collectors, setCollectors] = useState<LumaCollector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCollectors();
  }, [search]);

  const fetchCollectors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/collectors/luma?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCollectors(data.collectors);
        
        // Fetch POAP data for each collector
        const poapPromises = data.collectors.map(async (collector: LumaCollector) => {
          try {
            const res = await fetch(`/api/poap/validate-event?eventId=${collector.drop.poapEventId}`);
            const poapInfo = await res.json();
            return { id: collector.id, poap: poapInfo.event };
          } catch {
            return { id: collector.id, poap: null };
          }
        });
        
        const poapResults = await Promise.all(poapPromises);
        const collectorsWithPoap = data.collectors.map((collector: LumaCollector) => {
          const poapResult = poapResults.find(r => r.id === collector.id);
          return { ...collector, poapData: poapResult?.poap };
        });
        
        setCollectors(collectorsWithPoap);
      }
    } catch (error) {
      console.error('Failed to fetch collectors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by event name, collector name or email"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
        />
      </div>

      {/* Collectors Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : collectors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No Luma collectors found</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Event Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Collector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  ETH Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  POAP
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {collectors.map((collector) => (
                <tr key={collector.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/icons/luma.svg"
                        alt="Luma"
                        width={20}
                        height={20}
                      />
                      <span className="text-sm text-white truncate max-w-[150px]">
                        {collector.drop.lumaEventUrl?.replace('https://lu.ma/', '') || 'Unknown Event'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(collector.sentAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {collector.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {collector.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300 font-mono">
                      {collector.guest?.ethAddress ? 
                        `${collector.guest.ethAddress.slice(0, 6)}...${collector.guest.ethAddress.slice(-4)}` : 
                        '-'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {collector.poapData && (
                      <a
                        href={`https://poap.gallery/drops/${collector.drop.poapEventId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:opacity-80"
                      >
                        <Image
                          src={collector.poapData.image_url}
                          alt={collector.poapData.name}
                          width={40}
                          height={40}
                          className="rounded-lg"
                        />
                        <span className="text-sm text-blue-400 hover:underline">
                          {collector.poapData.name}
                        </span>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}