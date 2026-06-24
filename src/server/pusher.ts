import "server-only";

import Pusher from "pusher";

// Server-side Pusher client. With placeholder env values it still constructs;
// network calls (trigger) are wrapped so a missing/invalid config degrades
// gracefully — messages still persist, only realtime delivery is skipped.
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID ?? "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
  secret: process.env.PUSHER_SECRET ?? "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu",
  useTLS: true,
});

/** Private channel name for an event's chat. */
export function eventChannel(eventId: string) {
  return `private-event-${eventId}`;
}

/** Best-effort realtime broadcast; never throws to the caller. */
export async function triggerNewMessage(eventId: string, message: unknown) {
  try {
    await pusherServer.trigger(eventChannel(eventId), "new-message", message);
  } catch (err) {
    console.error("Pusher trigger failed (is PUSHER_* configured?):", err);
  }
}
