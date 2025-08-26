import { useEffect, useState, useRef } from 'react';
import { getPusherClient } from '~/lib/pusher';
import type { Channel } from 'pusher-js';

interface Stats {
  claims?: number;
  lumaDeliveries?: number;
  instagramDeliveries?: number;
  instagramStats?: {
    collectors: number;
    interactions: number;
  };
}

export function useRealtimePusher(dropIds: string[]) {
  const [statsUpdates, setStatsUpdates] = useState<Record<string, Stats>>({});
  const channelsRef = useRef<Channel[]>([]);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);

  useEffect(() => {
    if (dropIds.length === 0) return;

    // Initialize Pusher client
    const pusher = getPusherClient();
    pusherRef.current = pusher;

    // Subscribe to channels for each drop
    dropIds.forEach(dropId => {
      const channel = pusher.subscribe(`drop-${dropId}`);
      channelsRef.current.push(channel);

      // Listen for stats updates
      channel.bind('stats-update', async (data: { dropId: string; type: string; timestamp: string }) => {
        console.log('[Pusher] Received stats update:', data);
        
        // Fetch updated stats for this drop
        try {
          const response = await fetch(`/api/drops/stats?ids=${data.dropId}`);
          if (response.ok) {
            const result = await response.json();
            setStatsUpdates(prev => ({
              ...prev,
              [data.dropId]: result.stats[data.dropId]
            }));
          }
        } catch (error) {
          console.error('[Pusher] Error fetching updated stats:', error);
        }
      });
    });

    // Also subscribe to general stats channel for story-based updates
    const statsChannel = pusher.subscribe('drop-stats');
    statsChannel.bind('stats-update', async (data: { dropId: string; type: string; timestamp: string }) => {
      console.log('[Pusher] Received general stats update:', data);
      
      // Find drops that match this story ID
      const matchingDropIds = dropIds.filter(id => id === data.dropId);
      if (matchingDropIds.length > 0) {
        // Fetch updated stats
        try {
          const response = await fetch(`/api/drops/stats?ids=${matchingDropIds.join(',')}`);
          if (response.ok) {
            const result = await response.json();
            setStatsUpdates(prev => ({
              ...prev,
              ...result.stats
            }));
          }
        } catch (error) {
          console.error('[Pusher] Error fetching updated stats:', error);
        }
      }
    });

    // Cleanup
    return () => {
      // Unsubscribe from all channels
      channelsRef.current.forEach(channel => {
        pusher.unsubscribe(channel.name);
      });
      pusher.unsubscribe('drop-stats');
      channelsRef.current = [];
      
      // Disconnect pusher
      pusher.disconnect();
    };
  }, [dropIds.join(',')]); // Use string join to avoid infinite re-renders

  return { statsUpdates };
}