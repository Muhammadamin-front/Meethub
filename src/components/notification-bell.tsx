import { NotificationMenu } from "@/components/notification-menu";
import { getCurrentUser } from "@/server/auth";
import { getMyNotifications } from "@/server/notifications";

/** Header bell — renders nothing for signed-out users. */
export async function NotificationBell() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { items, unread } = await getMyNotifications(user.id);
  return <NotificationMenu userId={user.id} items={items} unread={unread} />;
}
