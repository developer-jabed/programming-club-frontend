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
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Award,
  Bell,
  BellOff,
  Calendar,
  CheckCheck,
  Clock,
  FileText,
  Users,
} from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  type: "notice" | "event" | "attendance" | "result" | "assignment" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Mock data — replace with your API response.
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "notice",
    title: "New Notice Published",
    message: "Mid-term Exam Schedule has been published. Check your dashboard.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
  },
  {
    id: "2",
    type: "event",
    title: "Tech Fest 2026",
    message:
      "Annual Tech Festival starts from 20th May. Register your team now.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
  },
  {
    id: "3",
    type: "attendance",
    title: "Low Attendance Alert",
    message: "Your attendance in Data Structure is below 75%. Please improve.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
  },
  {
    id: "4",
    type: "result",
    title: "Semester Result Published",
    message:
      "3rd Semester Diploma Result has been declared. View your result now.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
  },
  {
    id: "5",
    type: "assignment",
    title: "Assignment Deadline",
    message: "Database Management System assignment due tomorrow at 11:59 PM.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    read: false,
  },
  {
    id: "6",
    type: "alert",
    title: "Class Cancellation",
    message:
      "Microprocessor class has been cancelled today due to faculty meeting.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
];

const TYPE_STYLES: Record<
  Notification["type"],
  { icon: typeof Bell; wrap: string }
> = {
  notice: {
    icon: FileText,
    wrap: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  },
  event: {
    icon: Calendar,
    wrap: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
  },
  attendance: {
    icon: Users,
    wrap: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  },
  result: {
    icon: Award,
    wrap: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  },
  assignment: {
    icon: Clock,
    wrap: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  },
  alert: {
    icon: AlertTriangle,
    wrap: "bg-red-400/10 text-red-300 ring-red-400/20",
  },
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className="group relative rounded-xl text-slate-300 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:ring-emerald-400/50 data-[state=open]:bg-white/[0.06]"
        >
          <Bell className="h-5 w-5 origin-top transition-transform duration-300 group-hover:rotate-12 group-data-[state=open]:rotate-12 motion-reduce:transform-none" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/50 motion-reduce:animate-none" />
              <span className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#1a1203] ring-2 ring-[#07110f]">
                {unreadCount > 9 ? "9+" : unreadCount}
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
          {unreadCount > 0 && (
            <Badge className="animate-in fade-in zoom-in-90 rounded-full border-0 bg-emerald-400/15 text-emerald-300 duration-300 hover:bg-emerald-400/15">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <ScrollArea className="h-[min(380px,60vh)] px-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-sm text-slate-500">
              <BellOff className="h-8 w-8 text-slate-600" />
              No notifications yet
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification, index) => {
                const { icon: Icon, wrap } = TYPE_STYLES[notification.type];

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    onSelect={(e) => {
                      e.preventDefault(); // keep the menu open
                      markAsRead(notification.id);
                    }}
                    style={{ animationDelay: `${index * 45}ms` }}
                    className={cn(
                      "mb-1 flex cursor-pointer items-start gap-3.5 rounded-xl p-3 duration-300 animate-in fade-in slide-in-from-top-1 fill-mode-both",
                      "transition-colors focus:bg-white/[0.06] focus:text-slate-100",
                      notification.read
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
                            notification.read ? "font-medium" : "font-semibold",
                          )}
                        >
                          {notification.title}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 transition-all duration-300",
                            notification.read
                              ? "scale-0 opacity-0"
                              : "scale-100 opacity-100",
                          )}
                        />
                      </div>

                      <p className="line-clamp-2 text-xs text-slate-400">
                        {notification.message}
                      </p>

                      <time
                        suppressHydrationWarning
                        className="block text-[10px] text-slate-500"
                      >
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                        })}
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
            disabled={unreadCount === 0}
            onSelect={(e) => {
              e.preventDefault();
              markAllAsRead();
            }}
            className="flex-1 cursor-pointer justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 focus:bg-white/[0.06] focus:text-white"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </DropdownMenuItem>

          <DropdownMenuItem className="flex-1 cursor-pointer justify-center rounded-xl py-2.5 text-sm font-semibold text-emerald-300 transition-colors duration-200 focus:bg-emerald-400/10 focus:text-emerald-200">
            View all
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
