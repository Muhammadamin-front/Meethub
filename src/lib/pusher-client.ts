import PusherClient from "pusher-js";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Placeholder keys (all "x") count as "not configured" so dev degrades cleanly.
export const REALTIME_ENABLED = !!PUSHER_KEY && !/^x+$/i.test(PUSHER_KEY);

let client: PusherClient | null = null;

/**
 * One shared Pusher connection for the whole app. Components subscribe/
 * unsubscribe their own channels but never create or disconnect the client,
 * so a user has a single WebSocket regardless of how many realtime features
 * are mounted (chat + notifications, etc.).
 */
export function getPusherClient(): PusherClient | null {
  if (!REALTIME_ENABLED) return null;
  if (!client) {
    client = new PusherClient(PUSHER_KEY!, {
      cluster: PUSHER_CLUSTER!,
      channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
    });
  }
  return client;
}
