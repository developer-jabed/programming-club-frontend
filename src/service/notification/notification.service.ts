/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

const errMsg = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

// ─────────────────────────────────────────────────────────────
// Get My Notifications (never cached: new ones must show up)
// ─────────────────────────────────────────────────────────────
export async function getMyNotifications(query?: string) {
  try {
    const response = await serverFetch.get(
      `/notifications${query ? `?${query}` : ""}`,
      { cache: "no-store" }
    );

    const result = await response.json();

    if (result.success) {
      const list = Array.isArray(result.data)
        ? result.data
        : result.data?.data ?? result.data?.notifications ?? [];

      return {
        success: true,
        data: list,
        meta: result.meta ?? result.data?.meta,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch notifications",
      data: [],
    };
  } catch (error: any) {
    console.error("[getMyNotifications]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Unread Count (never cached)
// ─────────────────────────────────────────────────────────────
export async function getUnreadCount() {
  try {
    const response = await serverFetch.get("/notifications/unread-count", {
      cache: "no-store",
    });

    const result = await response.json();

    if (result.success) {
      const raw = result.data;
      const count = typeof raw === "number" ? raw : Number(raw?.count ?? 0);
      return { success: true, data: { count } };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch unread count",
      data: { count: 0 },
    };
  } catch (error: any) {
    console.error("[getUnreadCount]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: { count: 0 },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Mark Single as Read
// ─────────────────────────────────────────────────────────────
export async function markNotificationAsRead(id: string) {
  try {
    const response = await serverFetch.patch(`/notifications/${id}/read`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("notifications", "max");
      revalidateTag("notifications-count", "max");
      return {
        success: true,
        message: result.message || "Marked as read",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to mark as read",
    };
  } catch (error: any) {
    console.error("[markNotificationAsRead]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Mark All as Read
// ─────────────────────────────────────────────────────────────
export async function markAllNotificationsAsRead() {
  try {
    const response = await serverFetch.patch("/notifications/read-all");
    const result = await response.json();

    if (result.success) {
      revalidateTag("notifications", "max");
      revalidateTag("notifications-count", "max");
      return {
        success: true,
        message: result.message || "All notifications marked as read",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to mark all as read",
    };
  } catch (error: any) {
    console.error("[markAllNotificationsAsRead]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Notification
// ─────────────────────────────────────────────────────────────
export async function deleteNotification(id: string) {
  try {
    const response = await serverFetch.delete(`/notifications/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("notifications", "max");
      revalidateTag("notifications-count", "max");
      return {
        success: true,
        message: result.message || "Notification deleted",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete notification",
    };
  } catch (error: any) {
    console.error("[deleteNotification]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}