/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get My Notifications
// ─────────────────────────────────────────────────────────────
export async function getMyNotifications(query?: string) {
  try {
    const response = await serverFetch.get(
      `/notifications${query ? `?${query}` : ""}`,
      { next: { tags: ["notifications"] } }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
        meta: result.meta,
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Unread Count
// ─────────────────────────────────────────────────────────────
export async function getUnreadCount() {
  try {
    const response = await serverFetch.get("/notifications/unread-count", {
      next: { tags: ["notifications-count"], revalidate: 30 },
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}
