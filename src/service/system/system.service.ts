/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import { getUserInfo } from "../auth/getUserInfo";

// ─────────────────────────────────────────────────────────────
// Types (erased at runtime, safe to export from a "use server" file)
// ─────────────────────────────────────────────────────────────
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SystemHealth {
  status?: "OK" | "DEGRADED" | "DOWN" | string;
  version?: string;
  environment?: string;
  uptimeSeconds?: number;
  dbLatencyMs?: number;
  apiLatencyMs?: number;
  counts?: {
    members?: number;
    pendingApprovals?: number;
    failedRequestsToday?: number;
  };
  checkedAt?: string;
}

export interface SystemConfig {
  clubName: string;
  contactEmail: string;
  accentColor: string;
  registrationOpen: boolean;
  requireApproval: boolean;
  maintenanceMode: boolean;
  announcement: string;
  features: { tests: boolean; leaderboard: boolean; projects: boolean };
  semesters: string[];
  shifts: string[];
  groups: string[];
}

export type DangerAction = "reset-leaderboard" | "archive-semester" | "purge-logs";

// ─────────────────────────────────────────────────────────────
// Internal request helper (every call re-checks ADMIN on the server)
// ─────────────────────────────────────────────────────────────
type Method = "get" | "post" | "patch" | "delete";

async function request<T = any>(
  method: Method,
  url: string,
  body?: unknown
): Promise<ActionResult<T>> {
  try {
    const me = await getUserInfo();
    if (me?.role !== "ADMIN") return { success: false, message: "Forbidden" };

    const opts: any = { cache: "no-store" };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
      opts.headers = { "Content-Type": "application/json" };
    }

    const res = await (serverFetch as any)[method](url, opts);
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      return {
        success: false,
        message: json?.message || `Request failed (${res.status})`,
      };
    }
    return { success: true, data: json.data, message: json.message };
  } catch (error: any) {
    console.error(`[system ${method} ${url}]`, error?.message || error);
    return { success: false, message: error?.message || "Network error" };
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Health
// ─────────────────────────────────────────────────────────────
export const getSystemHealth = async () =>
  request<SystemHealth>("get", "/system/health");

// ─────────────────────────────────────────────────────────────
// 2/3. Configuration + feature toggles + maintenance
// ─────────────────────────────────────────────────────────────
export const getSystemConfig = async () =>
  request<SystemConfig>("get", "/system/config");

export const updateSystemConfig = async (patch: Partial<SystemConfig>) =>
  request<SystemConfig>("patch", "/system/config", patch);

// ─────────────────────────────────────────────────────────────
// 4. Audit log
// ─────────────────────────────────────────────────────────────
export const getAuditLogs = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return request("get", `/system/audit-logs?${qs.toString()}`);
};

// ─────────────────────────────────────────────────────────────
// 5. Security & sessions
// ─────────────────────────────────────────────────────────────
export const getActiveSessions = async () =>
  request("get", "/system/sessions");

export const forceLogout = async (userId: string) =>
  request("delete", `/system/sessions/${encodeURIComponent(userId)}`);

// ─────────────────────────────────────────────────────────────
// 6. Data tools
// ─────────────────────────────────────────────────────────────
/** Backend should return CSV text in `data`. */
export const exportData = async (type: "members" | "results" | "activities") =>
  request<string>("get", `/system/export/${type}`);

/** Sends raw CSV text; backend parses and creates members. */
export const importMembers = async (csv: string) =>
  request("post", "/system/import/members", { csv });

export const clearCaches = async (): Promise<ActionResult> => {
  const me = await getUserInfo();
  if (me?.role !== "ADMIN") return { success: false, message: "Forbidden" };

  // Add every tag you use with `next: { tags: [...] }`.
  // updateTag expires the cache immediately (Server Actions only).
  const tags = ["user-info", "analytics", "members", "projects", "leaderboard"];
  tags.forEach((t) => updateTag(t));
  return { success: true, message: `Revalidated ${tags.length} cache tags` };
};

// ─────────────────────────────────────────────────────────────
// 7. Danger zone
// ─────────────────────────────────────────────────────────────
export const runDangerAction = async (
  action: DangerAction,
  params: Record<string, unknown> = {}
) => request("post", `/system/danger/${action}`, params);