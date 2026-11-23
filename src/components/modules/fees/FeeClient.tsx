"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { Meta } from "@/types/fees.interface";
import { useUrlState } from "./urlState";
import { cn } from "@/types/fees.format";

// Re-exported so files that import `cn` from "./FeeClient" keep working.
export { cn };

// ─────────────────────────────────────────────────────────────
// Style tokens — same language as Users & Roles
// (dark glass surfaces, white/10 borders, emerald accent)
// ─────────────────────────────────────────────────────────────
export const cardCls =
  "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm";

export const inputBase =
  "h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-slate-100 " +
  "placeholder:text-slate-500 [color-scheme:dark] [&>option]:bg-[#0b1714] [&>option]:text-slate-100 " +
  "transition-colors hover:border-white/20 focus:border-emerald-400/60 focus:bg-white/[0.06] " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50";

export const inputCls = inputBase + " w-full";

export const thCls =
  "px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400";

const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50";

export const btn = {
  primary:
    btnBase +
    " h-10 bg-emerald-400 px-4 font-semibold text-emerald-950 shadow-[0_0_24px_-8px_rgba(52,211,153,0.7)] hover:bg-emerald-300",
  ghost:
    btnBase +
    " h-10 border border-white/10 bg-white/[0.04] px-3.5 font-medium text-slate-200 hover:border-white/20 hover:bg-white/[0.08]",
  danger: btnBase + " h-10 bg-red-500/90 px-4 font-semibold text-white hover:bg-red-500",
  small:
    btnBase +
    " h-8 border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-200 hover:border-white/20 hover:bg-white/[0.08]",
  link: "text-sm font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline disabled:opacity-50",
};

const iconBase =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition " +
  "focus-visible:outline-2 focus-visible:outline-emerald-300";

export const iconBtn = {
  neutral: iconBase + " hover:bg-white/10 hover:text-white",
  ok: iconBase + " hover:bg-emerald-400/10 hover:text-emerald-300",
  danger: iconBase + " text-red-400/80 hover:bg-red-500/10 hover:text-red-400",
};

// ─────────────────────────────────────────────────────────────
// Icons (inline, no dependency)
// ─────────────────────────────────────────────────────────────
function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-4 w-4", className)}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const SearchIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const CardIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </Svg>
);
export const WaiveIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12h8" />
  </Svg>
);
export const TrashIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </Svg>
);
export const EditIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Svg>
);
export const VoidIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.6 5.6 12.8 12.8" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Avatar (letter fallback, same as Users list)
// ─────────────────────────────────────────────────────────────
export function Avatar({ name }: { name?: string | null }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/90 text-sm font-semibold text-emerald-950">
      {(name?.trim().charAt(0) || "?").toUpperCase()}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Badge — dot + label, like the ACTIVE / MEMBER chips
// ─────────────────────────────────────────────────────────────
const GREEN = "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
const RED = "bg-red-400/10 text-red-300 ring-red-400/20";
const GREY = "bg-white/5 text-slate-400 ring-white/10";

const TONES: Record<string, string> = {
  PAID: GREEN,
  RECEIVED: GREEN,
  ACTIVE: GREEN,
  UNPAID: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  PARTIAL: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  OVERDUE: RED,
  VOIDED: RED,
  WAIVED: GREY,
  INACTIVE: GREY,
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        TONES[value] ?? GREY
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal (native <dialog>: focus trap, Esc, backdrop for free)
// Mount it only while open → zero cost when closed.
// ─────────────────────────────────────────────────────────────
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b1714] p-0 text-slate-100 shadow-2xl shadow-black/60 [color-scheme:dark] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <button
          type="button"
          aria-label="Close"
          onClick={() => ref.current?.close()}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-slate-500">{hint}</span>}
      {error && <span className="block text-xs text-red-400">{error}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Toasts (tiny store, no dependency)
// ─────────────────────────────────────────────────────────────
type T = { id: number; kind: "ok" | "err"; msg: string };
const EMPTY: T[] = [];
let items: T[] = EMPTY;
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

const push = (kind: T["kind"], msg: string) => {
  const t = { id: ++seq, kind, msg };
  items = [...items, t];
  emit();
  setTimeout(() => {
    items = items.filter((x) => x.id !== t.id);
    emit();
  }, 3500);
};

export const toast = {
  success: (m: string) => push("ok", m),
  error: (m: string) => push("err", m),
};

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => items,
    () => EMPTY
  );

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/40 backdrop-blur",
            t.kind === "ok"
              ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-200"
              : "border-red-400/30 bg-red-950/90 text-red-200"
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination (URL driven)
// ─────────────────────────────────────────────────────────────
export function Pagination({ meta }: { meta?: Meta }) {
  const { set, pending } = useUrlState();
  if (!meta) return null;

  const limit = meta.limit ?? 20;
  const total = meta.total ?? 0;
  const page = meta.page ?? 1;
  const pages = meta.totalPages ?? Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 text-sm text-slate-400">
      <span className="tabular-nums">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <select
          aria-label="Rows per page"
          value={limit}
          disabled={pending}
          onChange={(e) => set({ limit: e.target.value })}
          className="h-8 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-xs text-slate-200 [color-scheme:dark] [&>option]:bg-[#0b1714] focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
        >
          {[10, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        <button
          className={btn.small}
          disabled={pending || page <= 1}
          onClick={() => set({ page: String(page - 1) })}
        >
          Previous
        </button>
        <span className="min-w-[3.5rem] text-center tabular-nums text-slate-300">
          {page} / {pages}
        </span>
        <button
          className={btn.small}
          disabled={pending || page >= pages}
          onClick={() => set({ page: String(page + 1) })}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sortable column header (URL driven: sortBy + order)
// ─────────────────────────────────────────────────────────────
export function SortHeader({
  field,
  label,
  defaultBy,
  right,
}: {
  field: string;
  label: string;
  defaultBy: string;
  right?: boolean;
}) {
  const { sp, set } = useUrlState();
  const by = sp.get("sortBy") ?? defaultBy;
  const order = sp.get("order") ?? "desc";
  const active = by === field;

  return (
    <th
      aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}
      className={cn(thCls, right && "text-right")}
    >
      <button
        type="button"
        onClick={() =>
          set(active ? { order: order === "asc" ? "desc" : "asc" } : { sortBy: field, order: "desc" })
        }
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-white",
          active && "text-emerald-300"
        )}
      >
        {label}
        <span aria-hidden className="text-[10px]">
          {active ? (order === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-16 text-center text-sm text-slate-500">{children}</div>;
}

export function ErrorBar({ children }: { children: ReactNode }) {
  return (
    <p className="border-b border-red-400/20 bg-red-400/10 px-5 py-2.5 text-sm text-red-300">{children}</p>
  );
}