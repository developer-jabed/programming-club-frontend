/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  createExpenseCategory,
  recordExpense,
  updateExpenseCategory,
  voidExpense,
} from "@/service/expanses/expanses.service";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────
const LOW_FUND = 5000; // keep in sync with LOW_FUND_THRESHOLD on the backend
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const money = (n: number | undefined | null) =>
  `৳${(n ?? 0).toLocaleString("en-IN")}`;

const fmtDate = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const todayInput = () => new Date().toISOString().slice(0, 10);

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20";
const selectCls = cn(inputCls, "appearance-none pr-8");
const ghostBtn =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50";
const primaryBtn =
  "inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60";

// ─────────────────────────────────────────────────────────────
// Small UI pieces
// ─────────────────────────────────────────────────────────────
function Pill({
  tone,
  children,
}: {
  tone: "emerald" | "rose" | "amber" | "slate";
  children: React.ReactNode;
}) {
  const tones = {
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    rose: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  const color = {
    default: "text-white",
    good: "text-emerald-300",
    bad: "text-rose-400",
    warn: "text-amber-300",
  }[tone];
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", color)}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full rounded-3xl border border-white/10 bg-[#07130f] p-6 shadow-2xl",
          wide ? "max-w-2xl" : "max-w-md",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-300">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
type Tab = "expenses" | "overview" | "categories";

export default function ExpensesClient({
  year,
  summary,
  categories,
  expenses,
  meta,
  filteredTotal,
  loadError,
}: {
  year: number;
  summary: any | null;
  categories: any[];
  expenses: any[];
  meta: any | null;
  filteredTotal: number;
  loadError: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [tab, setTab] = useState<Tab>("expenses");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const [recordOpen, setRecordOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [voiding, setVoiding] = useState<any | null>(null);
  const [catModal, setCatModal] = useState<
    { mode: "create" } | { mode: "edit"; cat: any } | null
  >(null);

  const balance = summary?.balance ?? 0;
  const collected = summary?.collected ?? 0;
  const spent = summary?.spent ?? 0;
  const usedPct = collected > 0 ? Math.min(100, Math.round((spent / collected) * 100)) : 0;
  const low = balance <= LOW_FUND;

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories],
  );

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── URL-driven filters ────────────────────────────────────
  const setParams = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    if (!("page" in patch)) sp.delete("page");
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };

  const [search, setSearch] = useState(params.get("search") ?? "");
  useEffect(() => {
    if (search === (params.get("search") ?? "")) return;
    const t = setTimeout(() => setParams({ search: search || undefined }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const status = params.get("status") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const month = params.get("month") ?? "";
  const yearParam = params.get("year") ?? "";
  const hasFilters = !!(search || status || categoryId || month || yearParam);

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // ── Pagination ────────────────────────────────────────────
  const page = Number(meta?.page ?? 1);
  const limit = Number(meta?.limit ?? 10);
  const total = Number(meta?.total ?? expenses.length);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  // ── CSV export of the rows currently shown ────────────────
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Date", "Title", "Category", "Amount", "Status", "Paid to", "Description"],
      ...expenses.map((e) => [
        fmtDate(e.spentAt),
        e.title,
        e.category?.name,
        e.amount,
        e.status,
        e.paidTo,
        e.description,
      ]),
    ];
    const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `expenses-${todayInput()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const maxMonth = Math.max(
    1,
    ...(summary?.byMonth ?? []).flatMap((m: any) => [m.collected, m.spent]),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 text-white">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="mt-1 text-sm text-slate-400">
          Record spending, track the fund and manage expense categories.
        </p>
      </header>

      {loadError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {/* Fund stats */}
      <section aria-label="Fund summary" className="space-y-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <Stat label="Collected" value={money(collected)} hint="Received payments" />
          <Stat label="Spent" value={money(spent)} hint={`${summary?.expenseCount ?? 0} expenses`} />
          <Stat
            label="Fund balance"
            value={money(balance)}
            hint={low ? "Running low" : "Available to spend"}
            tone={low ? "warn" : "good"}
          />
          <Stat
            label="This filter"
            value={money(filteredTotal)}
            hint={hasFilters ? "Matching expenses" : "All recorded"}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-300">Fund used</span>
            <span className="tabular-nums text-slate-400">
              {money(spent)} of {money(collected)}{" "}
              <b className={cn("ml-1", low ? "text-amber-300" : "text-emerald-300")}>
                {usedPct}%
              </b>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                usedPct >= 90 ? "bg-rose-400" : usedPct >= 70 ? "bg-amber-400" : "bg-emerald-400",
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>

        {/* Top categories */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(summary?.byCategory ?? []).slice(0, 4).map((c: any) => (
            <div
              key={c.categoryId}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <Pill tone="emerald">{c.name}</Pill>
              <p className="mt-3 text-sm font-semibold">
                {c.count} {c.count === 1 ? "expense" : "expenses"}
              </p>
              <p className="text-xs tabular-nums text-slate-500">{money(c.total)}</p>
            </div>
          ))}
          {(summary?.byCategory ?? []).length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
              No spending recorded yet.
            </p>
          )}
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1"
        >
          {(
            [
              ["expenses", "Expenses"],
              ["overview", "Overview"],
              ["categories", "Categories"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                tab === key
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "text-slate-300 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={primaryBtn} onClick={() => setRecordOpen(true)}>
            <Plus className="h-4 w-4" /> Record expense
          </button>
          <button className={ghostBtn} onClick={() => setCatModal({ mode: "create" })}>
            New category
          </button>
        </div>
      </div>

      {/* ── Expenses tab ─────────────────────────────────── */}
      {tab === "expenses" && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, description or payee…"
                className={cn(inputCls, "pl-10")}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setParams({ status: e.target.value || undefined })}
              className={cn(selectCls, "w-auto")}
              aria-label="Status"
            >
              <option value="">All statuses</option>
              <option value="RECORDED">Recorded</option>
              <option value="VOIDED">Voided</option>
            </select>
            <select
              value={categoryId}
              onChange={(e) => setParams({ categoryId: e.target.value || undefined })}
              className={cn(selectCls, "w-auto")}
              aria-label="Category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setParams({ month: e.target.value || undefined })}
              className={cn(selectCls, "w-auto")}
              aria-label="Month"
              disabled={!yearParam}
              title={!yearParam ? "Pick a year first" : undefined}
            >
              <option value="">All months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={yearParam}
              onChange={(e) =>
                setParams({ year: e.target.value || undefined, month: undefined })
              }
              className={cn(selectCls, "w-auto")}
              aria-label="Year"
            >
              <option value="">All years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                className={ghostBtn}
                onClick={() => {
                  setSearch("");
                  startTransition(() => router.push(pathname));
                }}
              >
                Clear
              </button>
            )}
            <button className={ghostBtn} onClick={exportCsv} disabled={!expenses.length}>
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-opacity",
              pending && "opacity-60",
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-5 py-4 font-semibold">Expense</th>
                    <th className="px-3 py-4 font-semibold">Category</th>
                    <th className="px-3 py-4 text-right font-semibold">Amount</th>
                    <th className="px-3 py-4 font-semibold">Spent on</th>
                    <th className="px-3 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.map((e) => {
                    const voided = e.status === "VOIDED";
                    return (
                      <tr key={e.id} className="transition hover:bg-white/[0.03]">
                        <td className="px-5 py-4">
                          <p className={cn("font-semibold", voided && "text-slate-500 line-through")}>
                            {e.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-slate-500">
                            {e.paidTo ? `${e.paidTo} · ` : ""}
                            {e.description}
                          </p>
                        </td>
                        <td className="px-3 py-4 text-slate-300">{e.category?.name}</td>
                        <td
                          className={cn(
                            "px-3 py-4 text-right font-semibold tabular-nums",
                            voided && "text-slate-500 line-through",
                          )}
                        >
                          {money(e.amount)}
                        </td>
                        <td className="px-3 py-4 text-slate-300">{fmtDate(e.spentAt)}</td>
                        <td className="px-3 py-4">
                          <Pill tone={voided ? "rose" : "emerald"}>
                            {voided ? "Voided" : "Recorded"}
                          </Pill>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              aria-label="View details"
                              onClick={() => setViewing(e)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {!voided && (
                              <button
                                aria-label="Void expense"
                                onClick={() => setVoiding(e)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-rose-400/10 hover:text-rose-300"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                        {hasFilters
                          ? "No expenses match these filters."
                          : "No expenses recorded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-slate-400">
              <span>
                {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-30"
                  disabled={page <= 1}
                  onClick={() => setParams({ page: String(page - 1) })}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-30"
                  disabled={page >= totalPages}
                  onClick={() => setParams({ page: String(page + 1) })}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Overview tab ─────────────────────────────────── */}
      {tab === "overview" && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Collected vs spent · {year}</h2>
              <select
                value={yearParam || String(year)}
                onChange={(e) => setParams({ year: e.target.value, month: undefined })}
                className={cn(selectCls, "w-auto py-1.5")}
                aria-label="Chart year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex h-52 items-end gap-2">
              {(summary?.byMonth ?? []).map((m: any) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end justify-center gap-1">
                    <div
                      title={`Collected ${money(m.collected)}`}
                      className="w-1/2 max-w-3 rounded-t bg-emerald-400/80"
                      style={{ height: `${(m.collected / maxMonth) * 100}%` }}
                    />
                    <div
                      title={`Spent ${money(m.spent)}`}
                      className="w-1/2 max-w-3 rounded-t bg-rose-400/80"
                      style={{ height: `${(m.spent / maxMonth) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{MONTHS[m.month - 1]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <i className="h-2 w-2 rounded-full bg-emerald-400" /> Collected
              </span>
              <span className="flex items-center gap-2">
                <i className="h-2 w-2 rounded-full bg-rose-400" /> Spent
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 text-sm font-semibold">Spending by category</h2>
            <ul className="space-y-4">
              {(summary?.byCategory ?? []).map((c: any) => {
                const pct = spent > 0 ? Math.round((c.total / spent) * 100) : 0;
                return (
                  <li key={c.categoryId}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="tabular-nums text-slate-400">
                        {money(c.total)} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
              {(summary?.byCategory ?? []).length === 0 && (
                <p className="text-sm text-slate-500">Nothing to show yet.</p>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* ── Categories tab ───────────────────────────────── */}
      {tab === "categories" && (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-5 py-4 font-semibold">Name</th>
                <th className="px-3 py-4 font-semibold">Description</th>
                <th className="px-3 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-semibold">{c.name}</td>
                  <td className="px-3 py-4 text-slate-400">{c.description || "—"}</td>
                  <td className="px-3 py-4">
                    <Pill tone={c.isActive ? "emerald" : "slate"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Pill>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        aria-label="Edit category"
                        onClick={() => setCatModal({ mode: "edit", cat: c })}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-500">
                    No categories yet. Create one to start recording expenses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      <RecordModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        categories={activeCategories}
        balance={balance}
        onDone={(ok, msg) => {
          showToast(ok, msg);
          if (ok) {
            setRecordOpen(false);
            router.refresh();
          }
        }}
      />

      <VoidModal
        expense={voiding}
        onClose={() => setVoiding(null)}
        onDone={(ok, msg) => {
          showToast(ok, msg);
          if (ok) {
            setVoiding(null);
            router.refresh();
          }
        }}
      />

      <CategoryModal
        state={catModal}
        onClose={() => setCatModal(null)}
        onDone={(ok, msg) => {
          showToast(ok, msg);
          if (ok) {
            setCatModal(null);
            router.refresh();
          }
        }}
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ""}
        description={viewing ? `${viewing.category?.name} · ${fmtDate(viewing.spentAt)}` : ""}
        wide
      >
        {viewing && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-slate-400">Amount</span>
              <span className="text-2xl font-bold tabular-nums">{money(viewing.amount)}</span>
            </div>
            <p className="whitespace-pre-wrap text-slate-300">{viewing.description}</p>
            <dl className="grid grid-cols-2 gap-4 text-xs">
              {[
                ["Status", viewing.status === "VOIDED" ? "Voided" : "Recorded"],
                ["Paid to", viewing.paidTo],
                ["Project", viewing.project?.title],
                ["Sector", viewing.sector?.name],
                ["Recorded by", viewing.recordedBy?.name],
                ["Recorded on", fmtDate(viewing.createdAt)],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="mt-0.5 text-sm text-white">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {viewing.receiptUrl && (
              <a
                href={viewing.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> View receipt
              </a>
            )}
            {viewing.status === "VOIDED" && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">
                <p className="font-semibold">
                  Voided by {viewing.voidedBy?.name ?? "—"} on {fmtDate(viewing.voidedAt)}
                </p>
                <p className="mt-1 text-sm">{viewing.voidReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={cn(
            "fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur",
            toast.ok
              ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-200"
              : "border-rose-400/30 bg-rose-950/90 text-rose-200",
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Record expense
// ─────────────────────────────────────────────────────────────
function RecordModal({
  open,
  onClose,
  categories,
  balance,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  categories: any[];
  balance: number;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const blank = {
    categoryId: "",
    title: "",
    description: "",
    amount: "",
    spentAt: todayInput(),
    paidTo: "",
    receiptUrl: "",
  };
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank) => (e: any) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (open) {
      setF({ ...blank, spentAt: todayInput() });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amount = Number(f.amount);
  const after = balance - (Number.isFinite(amount) ? amount : 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.categoryId) return setError("Choose a category");
    if (!f.title.trim()) return setError("Title is required");
    if (f.description.trim().length < 3)
      return setError("Description is required (at least 3 characters)");
    if (!Number.isInteger(amount) || amount < 1)
      return setError("Amount must be a whole number greater than 0");
    if (amount > balance)
      return setError(`Insufficient fund. Available balance: ${money(balance)}`);

    setBusy(true);
    const res = await recordExpense({
      categoryId: f.categoryId,
      title: f.title.trim(),
      description: f.description.trim(),
      amount,
      spentAt: f.spentAt ? new Date(f.spentAt).toISOString() : undefined,
      paidTo: f.paidTo.trim() || undefined,
      receiptUrl: f.receiptUrl.trim() || undefined,
    });
    setBusy(false);
    if (res.success) onDone(true, "Expense recorded");
    else setError(res.message);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Record expense"
      description={`Available fund balance: ${money(balance)}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select value={f.categoryId} onChange={set("categoryId")} className={selectCls}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (৳)">
            <input
              inputMode="numeric"
              value={f.amount}
              onChange={set("amount")}
              placeholder="0"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Title">
          <input
            value={f.title}
            onChange={set("title")}
            maxLength={120}
            placeholder="e.g. Printing for workshop"
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={f.description}
            onChange={set("description")}
            rows={3}
            placeholder="What was this spent on, and why?"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Spent on">
            <input type="date" value={f.spentAt} onChange={set("spentAt")} className={inputCls} />
          </Field>
          <Field label="Paid to (optional)" hint="Visible to staff only">
            <input value={f.paidTo} onChange={set("paidTo")} className={inputCls} />
          </Field>
        </div>
        <Field label="Receipt URL (optional)">
          <input
            type="url"
            value={f.receiptUrl}
            onChange={set("receiptUrl")}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>

        {f.amount && Number.isFinite(amount) && amount > 0 && (
          <p
            className={cn(
              "rounded-xl border px-3.5 py-2.5 text-xs",
              after < 0
                ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                : after <= LOW_FUND
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                  : "border-white/10 bg-white/[0.03] text-slate-400",
            )}
          >
            Balance after this expense: <b>{money(after)}</b>
            {after >= 0 && after <= LOW_FUND && " — the fund will be running low."}
          </p>
        )}

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Record expense
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Void expense
// ─────────────────────────────────────────────────────────────
function VoidModal({
  expense,
  onClose,
  onDone,
}: {
  expense: any | null;
  onClose: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReason("");
    setError("");
  }, [expense]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) return setError("Reason is required (at least 3 characters)");
    setBusy(true);
    const res = await voidExpense(expense.id, reason.trim());
    setBusy(false);
    if (res.success) onDone(true, "Expense voided");
    else setError(res.message);
  };

  return (
    <Modal
      open={!!expense}
      onClose={onClose}
      title="Void expense"
      description="Voiding returns the money to the fund. The record is kept for audit."
    >
      {expense && (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <span className="font-semibold">{expense.title}</span>
            <span className="font-bold tabular-nums">{money(expense.amount)}</span>
          </div>
          <Field label="Reason">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this expense being voided?"
              className={inputCls}
            />
          </Field>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={ghostBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Void expense
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Category create / edit
// ─────────────────────────────────────────────────────────────
function CategoryModal({
  state,
  onClose,
  onDone,
}: {
  state: { mode: "create" } | { mode: "edit"; cat: any } | null;
  onClose: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state?.mode === "edit") {
      setName(state.cat.name);
      setDescription(state.cat.description ?? "");
      setIsActive(state.cat.isActive);
    } else {
      setName("");
      setDescription("");
      setIsActive(true);
    }
    setError("");
  }, [state]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    setBusy(true);
    const res =
      state?.mode === "edit"
        ? await updateExpenseCategory(state.cat.id, {
            name: name.trim(),
            description: description.trim(),
            isActive,
          })
        : await createExpenseCategory({
            name: name.trim(),
            description: description.trim() || undefined,
          });
    setBusy(false);
    if (res.success)
      onDone(true, state?.mode === "edit" ? "Category updated" : "Category created");
    else setError(res.message);
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={state?.mode === "edit" ? "Edit category" : "New category"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>
        {state?.mode === "edit" && (
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
            Active (inactive categories can't be used for new expenses)
          </label>
        )}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </form>
    </Modal>
  );
}