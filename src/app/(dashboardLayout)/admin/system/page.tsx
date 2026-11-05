/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from "next/navigation";
import {
  getActiveSessions,
  getAuditLogs,
  getSystemConfig,
  getSystemHealth,
} from "@/service/system/system.service";

import { getUserInfo } from "@/service/auth/getUserInfo";
import SystemClient from "@/components/modules/setting/SystemClient";
export const dynamic = "force-dynamic";

export default async function SystemPage() {
  // Server-side guard: typing the URL is not enough
  const me = await getUserInfo();
  if (!me) redirect("/login"); // ← adjust login route
  if (me.role !== "ADMIN") notFound();

  const [healthRes, configRes, logsRes, sessionsRes] = await Promise.all([
    getSystemHealth(),
    getSystemConfig(),
    getAuditLogs({ page: 1, limit: 20 }),
    getActiveSessions(),
  ]);

  const failed = [
    ["health", healthRes],
    ["configuration", configRes],
    ["audit log", logsRes],
    ["sessions", sessionsRes],
  ]
    .filter(([, r]: any) => !r.success)
    .map(([name]) => name as string);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Health, configuration, security and data tools
        </p>
      </div>

      <SystemClient
        health={healthRes.success ? (healthRes.data ?? null) : null}
        config={configRes.success ? (configRes.data ?? null) : null}
        logs={logsRes.success ? logsRes.data : []}
        sessions={sessionsRes.success ? sessionsRes.data : []}
        currentUserId={me.id}
        failed={failed}
      />
    </div>
  );
}