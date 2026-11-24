/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

// ─────────────────────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  try {
    const response = await serverFetch.get("/analytics/dashboard", {
      next: { tags: ["admin-dashboard"], revalidate: 60 },
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
      message: result.message || "Failed to fetch dashboard stats",
      data: null,
    };
  } catch (error: any) {
    console.error("[getDashboardStats]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Recent Activities
// ─────────────────────────────────────────────────────────────
export async function getRecentActivities() {
  try {
    const response = await serverFetch.get("/analytics/recent-activities", {
      next: { tags: ["recent-activities"], revalidate: 30 },
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
      message: result.message || "Failed to fetch activities",
      data: [],
    };
  } catch (error: any) {
    console.error("[getRecentActivities]", error);
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
// Leaderboard
//   period:   7d | 30d | 90d | this_month | last_month | all_time
//   limit / offset: pagination
//   group / semester: optional filters
// ─────────────────────────────────────────────────────────────
export async function getLeaderboard(
  params: {
    period?: string;
    limit?: number;
    offset?: number;
    group?: string;
    semester?: number | string;
  } = {},
) {
  try {
    const qs = new URLSearchParams();
    if (params.period) qs.set("period", params.period);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.group) qs.set("group", params.group);
    if (params.semester) qs.set("semester", String(params.semester));

    const query = qs.toString();
    const response = await serverFetch.get(
      `/analytics/leaderboard${query ? `?${query}` : ""}`,
      {
        // the URL (with its query) is part of the cache key,
        // so every period/filter is cached separately
        next: { tags: ["leaderboard"], revalidate: 60 },
      },
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch leaderboard",
      data: null,
    };
  } catch (error: any) {
    console.error("[getLeaderboard]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Project Stats
// ─────────────────────────────────────────────────────────────
export async function getProjectStats() {
  try {
    const response = await serverFetch.get("/analytics/projects", {
      next: { tags: ["project-stats"], revalidate: 60 },
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
      message: result.message || "Failed to fetch project stats",
      data: null,
    };
  } catch (error: any) {
    console.error("[getProjectStats]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Monthly Growth
// ─────────────────────────────────────────────────────────────
export async function getMonthlyGrowth() {
  try {
    const response = await serverFetch.get("/analytics/growth", {
      next: { tags: ["growth-stats"], revalidate: 300 },
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
      message: result.message || "Failed to fetch growth data",
      data: null,
    };
  } catch (error: any) {
    console.error("[getMonthlyGrowth]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Sector Stats
// ─────────────────────────────────────────────────────────────
export async function getSectorStats() {
  try {
    const response = await serverFetch.get("/analytics/sectors", {
      next: { tags: ["sector-stats"], revalidate: 60 },
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
      message: result.message || "Failed to fetch sector stats",
      data: null,
    };
  } catch (error: any) {
    console.error("[getSectorStats]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}