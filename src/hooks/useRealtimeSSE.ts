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
  const reconnectAttemptsRef = useRef(0);
  
  const connect = useCallback(() => {
    if (dropIds.length === 0 || eventSourceRef.current) return;
    
    console.log('[SSE] Connecting with dropIds:', dropIds);
    
    const url = `/api/drops/stats/stream?ids=${dropIds.join(',')}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
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
      eventSource.close();
      eventSourceRef.current = null;
      
      // Exponential backoff for reconnection
      const attempts = reconnectAttemptsRef.current;
      if (attempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${attempts + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      } else {
        console.error('[SSE] Max reconnection attempts reached');
      }
    };
    
    return eventSource;
  }, [dropIds]);
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[SSE] Disconnecting');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[SSE] Page hidden, disconnecting');
        disconnect();
      } else {
        console.log('[SSE] Page visible, reconnecting');
        setTimeout(connect, 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, disconnect]);
  
  return { statsUpdates, isConnected, lastUpdate };
}