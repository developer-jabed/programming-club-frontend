import { getMyNotifications, getUnreadCount } from "@/service/notification/notification.service";
import NotificationsClient from "@/components/modules/notifications/NotificationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 15;

export default async function NotificationsPage() {
  const [notifsRes, countRes] = await Promise.all([
    getMyNotifications(),
    getUnreadCount(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stay updated on tasks, projects, and club activity
        </p>
      </div>

      <NotificationsClient
        notifications={notifsRes.success ? notifsRes.data : []}
        unreadCount={countRes.success ? countRes.data?.count ?? 0 : 0}
      />
    </div>
  );
}
