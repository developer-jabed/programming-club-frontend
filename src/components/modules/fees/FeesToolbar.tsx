"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/types/fees.format";
import { DUE_STATUSES, MONTHS, PAYMENT_STATUSES, type Category } from "@/types/fees.interface";
import { PlusIcon, SearchIcon, btn, inputBase } from "./FeeClient";
import { useUrlState } from "./urlState";

const RecordPaymentDialog = dynamic(() => import("./Dialogue").then((m) => m.RecordPaymentDialog));
const GenerateMonthlyDialog = dynamic(() => import("./Dialogue").then((m) => m.GenerateMonthlyDialog));
const CreateDuesDialog = dynamic(() => import("./Dialogue").then((m) => m.CreateDuesDialog));
const CategoryDialog = dynamic(() => import("./Dialogue").then((m) => m.CategoryDialog));

const TABS = [
  { key: "dues", label: "Dues" },
  { key: "payments", label: "Payments" },
  { key: "categories", label: "Categories" },
] as const;

type Tab = (typeof TABS)[number]["key"];
type Dlg = "pay" | "generate" | "dues" | "category" | null;

const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const selectCls = cn(inputBase, "min-w-[150px] cursor-pointer pr-8");

export function FeesToolbar({ tab, categories }: { tab: Tab; categories: Category[] }) {
  const [dlg, setDlg] = useState<Dlg>(null);
  const close = () => setDlg(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
          aria-label="Fees sections"
        >
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

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn.primary} onClick={() => setDlg("pay")}>
            <PlusIcon /> Record payment
          </button>
          <button type="button" className={btn.ghost} onClick={() => setDlg("generate")}>
            Generate monthly dues
          </button>
          <button type="button" className={btn.ghost} onClick={() => setDlg("dues")}>
            Create dues
          </button>
          <button type="button" className={btn.ghost} onClick={() => setDlg("category")}>
            New category
          </button>
        </div>
      </div>

      {tab !== "categories" && <Filters tab={tab} categories={categories} />}

      {dlg === "pay" && <RecordPaymentDialog categories={categories} onClose={close} />}
      {dlg === "generate" && <GenerateMonthlyDialog categories={categories} onClose={close} />}
      {dlg === "dues" && <CreateDuesDialog categories={categories} onClose={close} />}
      {dlg === "category" && <CategoryDialog onClose={close} />}
    </>
  );
}

function Filters({ tab, categories }: { tab: Tab; categories: Category[] }) {
  const { sp, set, pending } = useUrlState();
  const get = (k: string) => sp.get(k) ?? "";

  const urlSearch = get("search");
  const [q, setQ] = useState(urlSearch);

  // Debounced search → URL. Only fires when the typed value differs from the
  // URL, so it can never feed back into itself.
  useEffect(() => {
    const next = q.trim();
    if (next === urlSearch) return;
    const id = setTimeout(() => set({ search: next || null }), 400);
    return () => clearTimeout(id);
  }, [q, urlSearch, set]);

  const onChange = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    set({ [k]: e.target.value || null });

  const commit = (k: string, parse: (v: string) => string = (v) => v.trim()) => ({
    defaultValue: get(k),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const v = parse(e.target.value);
      if (v !== get(k)) set({ [k]: v || null });
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
  });

  const parseReceipt = (v: string) => {
    const m = v.match(/(\d+)\s*$/);
    return m ? String(Number(m[1])) : "";
  };

  const hasFilters = [...sp.keys()].some((k) => k !== "tab");
  const year = new Date().getFullYear();
  const overdueOn = get("overdue") === "true";

  return (
    <div className={cn("flex flex-wrap items-center gap-3", pending && "pointer-events-none opacity-70")}>
      <div className="relative min-w-[240px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, roll or registration…"
          className={cn(inputBase, "w-full pl-10")}
          aria-label="Search members"
        />
      </div>

      <select
        value={overdueOn ? "" : get("status")}
        onChange={onChange("status")}
        disabled={tab === "dues" && overdueOn}
        className={selectCls}
        aria-label="Status"
      >
        <option value="">All statuses</option>
        {(tab === "dues" ? DUE_STATUSES : PAYMENT_STATUSES).map((s) => (
          <option key={s} value={s}>
            {label(s)}
          </option>
        ))}
      </select>

      <select
        value={get("categoryId")}
        onChange={onChange("categoryId")}
        className={selectCls}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {tab === "dues" ? (
        <>
          <select value={get("month")} onChange={onChange("month")} className={selectCls} aria-label="Month">
            <option value="">All months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          <select value={get("year")} onChange={onChange("year")} className={cn(selectCls, "min-w-[120px]")} aria-label="Year">
            <option value="">All years</option>
            {[year + 1, year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <input
            key={`group-${get("group")}`}
            {...commit("group")}
            placeholder="Group"
            className={cn(inputBase, "w-[130px]")}
            aria-label="Group"
          />
          <input
            key={`semester-${get("semester")}`}
            {...commit("semester")}
            type="number"
            min={1}
            placeholder="Semester"
            className={cn(inputBase, "w-[120px]")}
            aria-label="Semester"
          />

          <label
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm transition-colors",
              overdueOn
                ? "border-red-400/40 bg-red-400/10 text-red-300"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
            )}
          >
            <input
              type="checkbox"
              checked={overdueOn}
              onChange={(e) => set({ overdue: e.target.checked ? "true" : null, status: null })}
              className="h-4 w-4 accent-red-400"
            />
            Overdue only
          </label>
        </>
      ) : (
        <>
          <input
            key={`receiptNo-${get("receiptNo")}`}
            {...commit("receiptNo", parseReceipt)}
            inputMode="numeric"
            placeholder="Receipt no. (e.g. 123)"
            className={cn(inputBase, "w-[190px]")}
            aria-label="Receipt number"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
            From
            <input
              type="date"
              value={get("from")}
              onChange={onChange("from")}
              className={cn(inputBase, "w-[150px]")}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
            To
            <input
              type="date"
              value={get("to")}
              onChange={onChange("to")}
              className={cn(inputBase, "w-[150px]")}
            />
          </label>
        </>
      )}

      {hasFilters && (
        <button
          type="button"
          className={btn.link}
          onClick={() => {
            setQ("");
            set({
              search: null,
              status: null,
              categoryId: null,
              month: null,
              year: null,
              group: null,
              semester: null,
              overdue: null,
              from: null,
              to: null,
              receiptNo: null,
              sortBy: null,
              order: null,
              limit: null,
            });
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}