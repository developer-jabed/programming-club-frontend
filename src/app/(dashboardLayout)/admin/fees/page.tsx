// app/(dashboard)/admin/fees/page.tsx
import { Suspense } from "react";
import { getFeeCategories, getFeeDues, getFeePayments } from "@/service/fees/fees.service";
import {
  dayEnd,
  dayStart,
  DUES_KEYS,
  flattenSP,
  PAYMENTS_KEYS,
  pick,
  type SP,
} from "@/types/fees.format";
import type { Category, Due, Payment } from "@/types/fees.interface";
import { SummaryCards, SummarySkeleton } from "@/components/modules/fees/Summary";
import { FeesToolbar } from "@/components/modules/fees/FeesToolbar";
import { Toaster } from "@/components/modules/fees/FeeClient";
import { CategoriesManager } from "@/components/modules/fees/Category";
import { PaymentsTable } from "@/components/modules/fees/PaymentTable";
import { DuesTable } from "@/components/modules/fees/DuesTable";


export const dynamic = "force-dynamic"; // Always fetch fresh data

type Tab = "dues" | "payments" | "categories";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Fees management",
};

// ✅ Fix for the themeColor warning
export const viewport = {
  themeColor: "#0f766e",
};

const requestTime = () => Date.now();

export default async function AdminFeesPage({ searchParams }: PageProps) {
  const sp = flattenSP(await searchParams);
  const tab: Tab =
    sp.tab === "payments" || sp.tab === "categories" ? sp.tab : "dues";

  // Categories are cheap (cached)
  const catRes = await getFeeCategories(tab === "categories");
  const categories = (catRes.data ?? []) as Category[];

  // Stable key – only changes when filters actually change
  const listKey = [
    tab,
    sp.search ?? "",
    sp.status ?? "",
    sp.categoryId ?? "",
    sp.month ?? "",
    sp.year ?? "",
    sp.group ?? "",
    sp.semester ?? "",
    sp.overdue ?? "",
    sp.from ?? "",
    sp.to ?? "",
    sp.receiptNo ?? "",
    sp.page ?? "1",
    sp.limit ?? "20",
    sp.sortBy ?? "",
    sp.order ?? "",
  ].join("|");

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Fees</h1>
        <p className="text-sm text-slate-500">
          Track dues, record payments and manage fee categories.
        </p>
      </header>

      {/* Summary – streams independently */}
      <Suspense fallback={<SummarySkeleton />}>
        <SummaryCards year={sp.year} month={sp.month} />
      </Suspense>

      {/* Toolbar + filters */}
      <Suspense
        fallback={
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
        }
      >
        <FeesToolbar tab={tab} categories={categories} />
      </Suspense>

      {/* Table / list – only remounts when filters change */}
      <Suspense key={listKey} fallback={<ListSkeleton />}>
        <List tab={tab} sp={sp} categories={categories} />
      </Suspense>

      <Toaster />
    </main>
  );
}

async function List({
  tab,
  sp,
  categories,
}: {
  tab: Tab;
  sp: SP;
  categories: Category[];
}) {
  if (tab === "categories") {
    return <CategoriesManager categories={categories} />;
  }

  if (tab === "payments") {
    const q = pick(sp, PAYMENTS_KEYS, { limit: "20" });
    if (q.from) q.from = dayStart(q.from);
    if (q.to) q.to = dayEnd(q.to);

    const r = await getFeePayments(q);
    return (
      <PaymentsTable
        rows={(r.data ?? []) as Payment[]}
        meta={r.meta}
        error={r.success ? undefined : r.message}
      />
    );
  }

  // Default: dues
  const r = await getFeeDues(pick(sp, DUES_KEYS, { limit: "20" }));
  return (
    <DuesTable
      rows={(r.data ?? []) as Due[]}
      meta={r.meta}
      categories={categories}
      now={requestTime()}
      error={r.success ? undefined : r.message}
    />
  );
}

function ListSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse border-b border-slate-100 bg-slate-50 last:border-0 even:bg-white"
        />
      ))}
    </div>
  );
}