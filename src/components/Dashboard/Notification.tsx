/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/service/notification/notification.service";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  CheckCheck,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Layers,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 30_000;

// Icon + colour per related entity
const ENTITY_STYLES: Record<string, { icon: typeof Bell; wrap: string }> = {
  Project: {
    icon: FolderKanban,
    wrap: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
  },
  Sector: {
    icon: Layers,
    wrap: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  },
  Task: {
    icon: ClipboardCheck,
    wrap: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  },
  TaskSubmission: {
    icon: ClipboardCheck,
    wrap: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  },
  Test: {
    icon: FileText,
    wrap: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  },
};

const DEFAULT_STYLE = {
  icon: Bell,
  wrap: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
};

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

export default function NotificationDropdown() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    const res = await getUnreadCount();
    if (res.success) setCount(res.data.count);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await getMyNotifications(
      "limit=10&sortBy=createdAt&sortOrder=desc",
    );
    if (res.success) setItems(res.data);
    setLoading(false);
  }, []);

  // Poll the unread count
  useEffect(() => {
    const first = setTimeout(refreshCount, 0);
    const timer = setInterval(refreshCount, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refreshCount]);

  // Load the latest items every time the menu opens
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      loadItems();
      refreshCount();
    }, 0);
    return () => clearTimeout(t);
  }, [open, loadItems, refreshCount]);

  const openItem = (n: any) => {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setCount((c) => Math.max(0, c - 1));
      markNotificationAsRead(n.id);
    }
    const href = hrefFor(n);
    if (href) router.push(href);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setCount(0);
    await markAllNotificationsAsRead();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
          className="group relative rounded-xl text-slate-300 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:ring-emerald-400/50 data-[state=open]:bg-white/[0.06]"
        >
          <Bell className="h-5 w-5 origin-top transition-transform duration-300 group-hover:rotate-12 group-data-[state=open]:rotate-12 motion-reduce:transform-none" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/50 motion-reduce:animate-none" />
              <span className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#1a1203] ring-2 ring-[#07110f]">
                {count > 9 ? "9+" : count}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1714]/95 p-2 text-slate-200 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-3">
          <span className="text-base font-semibold text-white">
            Notifications
          </span>
          {count > 0 && (
            <Badge className="animate-in fade-in zoom-in-90 rounded-full border-0 bg-emerald-400/15 text-emerald-300 duration-300 hover:bg-emerald-400/15">
              {count} new
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <ScrollArea className="h-[min(380px,60vh)] px-1">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-sm text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-sm text-slate-500">
              <BellOff className="h-8 w-8 text-slate-600" />
              No notifications yet
            </div>
          ) : (
            <div className="py-1">
              {items.map((n, index) => {
                const { icon: Icon, wrap } =
                  ENTITY_STYLES[n.entityType] ?? DEFAULT_STYLE;
                const read = !!n.isRead;
                const href = hrefFor(n);

                return (
                  <DropdownMenuItem
                    key={n.id}
                    onSelect={(e) => {
                      // Keep the menu open only when there is nowhere to go
                      if (!href) e.preventDefault();
                      openItem(n);
                    }}
                    style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                    className={cn(
                      "mb-1 flex cursor-pointer items-start gap-3.5 rounded-xl p-3 duration-300 animate-in fade-in slide-in-from-top-1 fill-mode-both",
                      "transition-colors focus:bg-white/[0.06] focus:text-slate-100",
                      read
                        ? "bg-transparent opacity-70 hover:opacity-100"
                        : "bg-emerald-400/[0.06]",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                        wrap,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-tight text-white",
                            read ? "font-medium" : "font-semibold",
                          )}
                        >
                          {n.title}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 transition-all duration-300",
                            read ? "scale-0 opacity-0" : "scale-100 opacity-100",
                          )}
                        />
                      </div>

                      <p className="line-clamp-2 text-xs text-slate-400">
                        {n.body}
                      </p>

                      <time
                        suppressHydrationWarning
                        className="block text-[10px] text-slate-500"
                      >
                        {n.createdAt
                          ? formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </time>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <div className="flex items-center gap-1 pt-1">
          <DropdownMenuItem
            disabled={count === 0}
            onSelect={(e) => {
              e.preventDefault();
              markAll();
            }}
            className="flex-1 cursor-pointer justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 focus:bg-white/[0.06] focus:text-white"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="flex-1 cursor-pointer justify-center rounded-xl py-2.5 text-sm font-semibold text-emerald-300 transition-colors duration-200 focus:bg-emerald-400/10 focus:text-emerald-200"
          >
            <Link href="/notifications" className="justify-center">
              View all
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}