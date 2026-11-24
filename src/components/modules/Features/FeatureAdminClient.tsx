/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, usePathname } from "next/navigation";
import RequestsPanel from "./RequestsPanel";
import UpdatesPanel from "./UpdatesPanel";

type Result = {
  success: boolean;
  data: any;
  meta?: any;
  message?: string;
} | null;

export default function FeatureAdminClient({
  tab,
  requests,
  updates,
}: {
  tab: "requests" | "updates";
  requests: Result;
  updates: Result;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { key: "requests", label: "Feature Requests" },
    { key: "updates", label: "Updates & Reports" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tabs with better spacing */}
      <div className="flex gap-1 border-b border-white/10 pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => router.push(`${pathname}?tab=${t.key}`)}
            className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-1">
        {tab === "requests" ? (
          <RequestsPanel result={requests} />
        ) : (
          <UpdatesPanel result={updates} />
        )}
      </div>
    </div>
  );
}