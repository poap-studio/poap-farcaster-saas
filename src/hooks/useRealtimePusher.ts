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
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<Channel[]>([]);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);

  useEffect(() => {
    if (dropIds.length === 0) return;

    console.log('[Pusher Hook] Initializing with dropIds:', dropIds);

    let pusher;
    try {
      // Initialize Pusher client
      pusher = getPusherClient();
      pusherRef.current = pusher;
      
      // Enable Pusher logging
      pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
        console.log('[Pusher] Connection state changed from', states.previous, 'to', states.current);
        setIsConnected(states.current === 'connected');
      });
      
      pusher.connection.bind('error', (err: Error) => {
        console.error('[Pusher] Connection error:', err);
      });
    } catch (error) {
      console.error('[Pusher] Failed to initialize client:', error);
      return;
    }

    // Subscribe to channels for each drop
    dropIds.forEach(dropId => {
      console.log(`[Pusher Hook] Subscribing to channel: drop-${dropId}`);
      const channel = pusher.subscribe(`drop-${dropId}`);
      channelsRef.current.push(channel);
      
      // Log subscription status
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`[Pusher] Successfully subscribed to drop-${dropId}`);
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropIds.join(',')]); // Use string join to avoid infinite re-renders

  return { statsUpdates, isConnected };
}