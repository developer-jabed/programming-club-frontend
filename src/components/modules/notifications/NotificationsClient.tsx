/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/service/notification/notification.service";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Props {
  notifications: any[];
  unreadCount: number;
}

// ⚠ Adjust these paths to your real routes
const hrefFor = (n: any): string | null => {
  if (!n.entityId) return null;
  switch (n.entityType) {
    case "Project":
      return `/projects/${n.entityId}`;
    case "Sector":
      return `/sectors/${n.entityId}`;
    case "Task":
    case "TaskSubmission":
      return `/tasks/${n.entityId}`;
    case "Test":
      return `/tests/${n.entityId}`;
    default:
      return null;
  }
};

export default function NotificationsClient({
  notifications,
  unreadCount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local overrides so the UI updates instantly; router.refresh() syncs with the server
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  const visible = notifications.filter((n) => !removedIds.has(n.id));
  const isRead = (n: any) => allRead || n.isRead || readIds.has(n.id);

  // Unread items that were just marked read or removed locally
  const locallyCleared = notifications.filter(
    (n) => !n.isRead && (readIds.has(n.id) || removedIds.has(n.id))
  ).length;
  const unread = allRead ? 0 : Math.max(0, unreadCount - locallyCleared);

  const markAll = () => {
    setAllRead(true);
    startTransition(async () => {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        toast.success("All marked as read");
        router.refresh();
      } else {
        setAllRead(false);
        toast.error(res.message);
      }
    });
  };

  const markOne = (id: string) => {
    setReadIds((p) => new Set(p).add(id));
    startTransition(async () => {
      const res = await markNotificationAsRead(id);
      if (res.success) router.refresh();
    });
  };

  const remove = (id: string) => {
    setRemovedIds((p) => new Set(p).add(id));
    startTransition(async () => {
      const res = await deleteNotification(id);
      if (res.success) {
        toast.success("Deleted");
        router.refresh();
      } else {
        setRemovedIds((p) => {
          const next = new Set(p);
          next.delete(id);
          return next;
        });
        toast.error(res.message);
      }
    });
  };

  const open = (n: any) => {
    if (!isRead(n)) markOne(n.id);
    const href = hrefFor(n);
    if (href) router.push(href);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? (
            <span className="font-medium text-primary">{unread} unread</span>
          ) : (
            "All caught up"
          )}
        </p>
        {unread > 0 && (
          <button
            onClick={markAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 opacity-50 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const read = isRead(n);
            const clickable = !!hrefFor(n);

            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  read
                    ? "border-border bg-card"
                    : "border-primary/25 bg-primary/5"
                }`}
              >
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    read ? "bg-muted-foreground/40" : "bg-primary"
                  }`}
                />

                <div
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => open(n) : undefined}
                  onKeyDown={
                    clickable ? (e) => e.key === "Enter" && open(n) : undefined
                  }
                  className={`min-w-0 flex-1 ${clickable ? "cursor-pointer" : ""}`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.body}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {n.createdAt
                      ? formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {!read && (
                    <button
                      onClick={() => markOne(n.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
                      title="Mark read"
                      aria-label="Mark as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}