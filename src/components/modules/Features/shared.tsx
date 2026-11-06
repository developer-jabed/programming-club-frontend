"use client";

import { useEffect, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// ── Constants ────────────────────────────────────────────────
export const REQUEST_STATUSES = [
  "OPEN",
  "UNDER_REVIEW",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "DUPLICATE",
] as const;

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const UPDATE_TYPES = [
  "FEATURE_UPDATE",
  "BUG_FIX",
  "IMPROVEMENT",
  "TECHNICAL_REPORT",
  "ANNOUNCEMENT",
  "ROADMAP",
] as const;

export const VISIBILITIES = ["PUBLIC", "MEMBERS_ONLY", "ADMIN_ONLY"] as const;

export const label = (v: string) =>
  v
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const fmtDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Theme classes (dark + emerald) ───────────────────────────
// সব color এখানে; theme বদলাতে চাইলে শুধু এই অংশ বদলালেই হবে।
export const ui = {
  card: "rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm",
  cardSoft: "rounded-xl border border-white/10 bg-black/20",
  text: "text-gray-100",
  muted: "text-gray-400",
  faint: "text-gray-500",
  divider: "border-white/10",
};

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 " +
  "placeholder:text-gray-500 outline-none [color-scheme:dark] " +
  "focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 " +
  "[&>option]:bg-[#0b1512] [&>option]:text-gray-100";

// টেবিলের ভেতরের ছোট select
export const selectSmCls =
  "rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-gray-200 outline-none " +
  "[color-scheme:dark] focus:border-emerald-500/60 disabled:opacity-60 " +
  "[&>option]:bg-[#0b1512] [&>option]:text-gray-100";

export const btnCls = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-emerald-400 disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-60",
};

// ── Badge ────────────────────────────────────────────────────
const BADGE: Record<string, string> = {
  // status
  OPEN: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  UNDER_REVIEW: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  PLANNED: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  IN_PROGRESS: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-300 ring-red-500/30",
  DUPLICATE: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
  // priority
  LOW: "bg-gray-500/20 text-gray-300 ring-gray-500/30",
  MEDIUM: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-300 ring-red-500/40",
  // update type
  FEATURE_UPDATE: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  BUG_FIX: "bg-red-500/15 text-red-300 ring-red-500/30",
  IMPROVEMENT: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  TECHNICAL_REPORT: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
  ANNOUNCEMENT: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  ROADMAP: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  // visibility
  PUBLIC: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  MEMBERS_ONLY: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  ADMIN_ONLY: "bg-gray-200/10 text-gray-200 ring-gray-200/30",
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        BADGE[value] ?? "bg-gray-500/20 text-gray-300 ring-gray-500/30"
      }`}
    >
      {label(value)}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`my-8 w-full rounded-xl border border-white/10 bg-[#0b1512] shadow-2xl shadow-black/50 ${
          wide ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Notice (action result message) ───────────────────────────
export function Notice({
  result,
}: {
  result: { success?: boolean; message?: string } | null | undefined;
}) {
  if (!result?.message) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        result.success
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {result.message}
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────
export function Pagination({
  meta,
  onPage,
}: {
  meta?: {
    page: number;
    totalPages: number;
    total: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPage: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-gray-400">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <button
          className={btnCls.ghost}
          disabled={!meta.hasPrevPage}
          onClick={() => onPage(meta.page - 1)}
        >
          Previous
        </button>
        <button
          className={btnCls.ghost}
          disabled={!meta.hasNextPage}
          onClick={() => onPage(meta.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ── URL query state ──────────────────────────────────────────
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const set = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    // page ছাড়া অন্য filter বদলালে page 1 এ ফিরে যাও
    if (!("page" in updates)) p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  return { sp, set, isPending };
}