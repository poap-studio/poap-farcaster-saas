import { useEffect, useState, useRef } from 'react';

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
  type: 'initial' | 'update';
  stats: Record<string, Stats>;
  timestamp?: string;
}

export function useRealtimeSSE(dropIds: string[]) {
  const [statsUpdates, setStatsUpdates] = useState<Record<string, Stats>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Don't connect if no drops
    if (dropIds.length === 0) {
      setIsConnected(false);
      return;
    }
    
    // Create new connection
    const url = `/api/drops/stats/stream?ids=${dropIds.join(',')}`;
    console.log('[SSE] Connecting with dropIds:', dropIds);
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
      setIsConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data: StatsUpdate = JSON.parse(event.data);
        console.log('[SSE] Received update:', data);
        
        setStatsUpdates(data.stats);
        setLastUpdate(new Date());
        
        // Check for changes and log them
        if (data.type === 'update') {
          console.log('[SSE] Stats updated at:', data.timestamp);
        }
      } catch (error) {
        console.error('[SSE] Error parsing message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setIsConnected(false);
      
      // Close the connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[SSE] Attempting to reconnect...');
        // This will trigger a re-run of the effect
        setStatsUpdates(prev => ({ ...prev }));
      }, 5000);
    };
    
    // Cleanup function
    return () => {
      console.log('[SSE] Cleaning up connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [dropIds.join(',')]); // Only re-run when dropIds actually change
  
  return { statsUpdates, isConnected, lastUpdate };
}