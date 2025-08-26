import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer() {
  if (!pusherServer) {
    // Using Pusher free tier for real-time updates
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID || "1891274",
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || "2d72de6d46e5b466b1b2",
      secret: process.env.PUSHER_SECRET || "e6c23f30e90f3aab909f",
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      useTLS: true
    });
  }
  return pusherServer;
}

// Client-side Pusher instance
export function getPusherClient() {
  if (typeof window === 'undefined') {
    throw new Error('getPusherClient can only be used on the client side');
  }
  
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "2d72de6d46e5b466b1b2", {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
  });
}