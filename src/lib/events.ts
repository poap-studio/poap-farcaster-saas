// Simple event emitter for server-side events
// This is used to trigger real-time updates from webhooks

type EventCallback = (data: unknown) => void;

class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();
  
  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }
  
  emit(event: string, data: unknown) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }
  
  removeAllListeners(event?: string) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Global event emitter for drop updates
export const dropEvents = new EventEmitter();

// Helper function to emit drop update events
export function emitDropUpdate(dropId: string, type: 'interaction' | 'collector') {
  dropEvents.emit('drop-update', {
    dropId,
    type,
    timestamp: new Date().toISOString()
  });
  
  // Also emit drop-specific event
  dropEvents.emit(`drop-${dropId}`, {
    type,
    timestamp: new Date().toISOString()
  });
}