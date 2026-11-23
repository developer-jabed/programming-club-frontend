// components/modules/fees/MyFeesNav.tsx
"use client";

import Link from "next/link";
import { cn } from "@/types/fees.format";
import { DUE_STATUSES } from "@/types/fees.interface";
import { useUrlState } from "../urlState";

const TABS = [
  { key: "dues", label: "My dues" },
  { key: "payments", label: "Payment history" },
] as const;

export function MyFeesNav({ tab }: { tab: "dues" | "payments" }) {
  const { sp, set, pending } = useUrlState();
  const status = sp.get("status") ?? "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" aria-label="Fees sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            prefetch
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "dues" && (
        <div className={cn("flex flex-wrap gap-2", pending && "pointer-events-none opacity-70")} role="group" aria-label="Filter by status">
          {[{ v: "", l: "All" }, ...DUE_STATUSES.map((s) => ({ v: s, l: s.charAt(0) + s.slice(1).toLowerCase() }))].map(
            ({ v, l }) => (
              <button
                key={l}
                type="button"
                aria-pressed={status === v}
                onClick={() => set({ status: v || null })}
                className={cn(
                  "h-9 rounded-xl border px-3.5 text-sm transition-colors",
                  status === v
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"
                )}
              >
                {l}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}