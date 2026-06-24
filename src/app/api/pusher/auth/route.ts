import { getCurrentUser, getEventAccess } from "@/server/auth";
import { eventChannel, pusherServer } from "@/server/pusher";
import { userChannel } from "@/server/notifications";

/**
 * Pusher private-channel auth. Authorizes:
 *  - private-event-<id>: members of that event (registrant / owning org / admin)
 *  - private-user-<id>:  only the user whose channel it is (notifications)
 * Membership/identity is verified here — never on the client.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  if (!socketId) return new Response("Bad request", { status: 400 });

  const eventMatch = channel.match(/^private-event-(.+)$/);
  if (eventMatch) {
    const access = await getEventAccess(eventMatch[1]);
    if (!access || !access.canRead || channel !== eventChannel(eventMatch[1])) {
      return new Response("Forbidden", { status: 403 });
    }
    return Response.json(pusherServer.authorizeChannel(socketId, channel));
  }

  const userMatch = channel.match(/^private-user-(.+)$/);
  if (userMatch) {
    const user = await getCurrentUser();
    if (!user || channel !== userChannel(user.id)) {
      return new Response("Forbidden", { status: 403 });
    }
    return Response.json(pusherServer.authorizeChannel(socketId, channel));
  }

  return new Response("Bad request", { status: 400 });
}
