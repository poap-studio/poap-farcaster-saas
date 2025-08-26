import { useEffect, useState, useRef, useCallback } from 'react';

interface Stats {
  claims?: number;
  lumaDeliveries?: number;
  instagramDeliveries?: number;
  instagramStats?: {
    collectors: number;
    interactions: number;
  };
}

interface StatsUpdate {
  dropId: string;
  platform: string;
  stats: Stats;
  timestamp: string;
}

export function useRealtimeStats(dropIds: string[]) {
  const [statsUpdates, setStatsUpdates] = useState<Record<string, Stats>>({});

  const connect = useCallback(() => {
    // For now, use polling instead of websockets due to Next.js limitations
    // This will poll every 10 seconds for updates
    const pollInterval = setInterval(async () => {
      if (dropIds.length === 0) return;
      
      try {
        const response = await fetch(`/api/drops/stats?ids=${dropIds.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setStatsUpdates(prev => ({
            ...prev,
            ...data.stats
          }));
        }
      } catch (error) {
        console.error('Error polling stats:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [dropIds]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { statsUpdates };
}

// Alternative implementation using Server-Sent Events (SSE)
export function useRealtimeStatsSSE(dropIds: string[]) {
  const [statsUpdates, setStatsUpdates] = useState<Record<string, Stats>>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (dropIds.length === 0) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource connection
    const eventSource = new EventSource(`/api/drops/stats/stream?ids=${dropIds.join(',')}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as StatsUpdate;
        setStatsUpdates(prev => ({
          ...prev,
          [update.dropId]: update.stats
        }));
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [dropIds]);

  return { statsUpdates };
}