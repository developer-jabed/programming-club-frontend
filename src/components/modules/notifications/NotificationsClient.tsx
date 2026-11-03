"use client";

import { useTransition } from "react";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/service/notification/notification.service";
import { Bell, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Props {
  notifications: any[];
  unreadCount: number;
}

export default function NotificationsClient({ notifications, unreadCount }: Props) {
  const [isPending, startTransition] = useTransition();

  const markAll = () => {
    startTransition(async () => {
      const res = await markAllNotificationsAsRead();
      if (res.success) toast.success("All marked as read");
      else toast.error(res.message);
    });
  };

  const markOne = (id: string) => {
    startTransition(async () => {
      await markNotificationAsRead(id);
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteNotification(id);
      if (res.success) toast.success("Deleted");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? (
            <span className="text-primary font-medium">{unreadCount} unread</span>
          ) : (
            "All caught up"
          )}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                n.isRead
                  ? "border-border bg-card"
                  : "border-primary/25 bg-primary/5"
              }`}
            >
              <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.isRead ? "bg-muted-foreground/40" : "bg-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {n.createdAt
                    ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markOne(n.id)}
                    className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-primary transition"
                    title="Mark read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => remove(n.id)}
                  className="rounded-lg p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
