// Put this at your member route, e.g. app/(member)/dashboard/fees/page.tsx
// Components below go in components/modules/fees/ next to FeeClient.tsx
import type { Metadata } from "next";
import { getFeeDues, getFeePayments, getMyFeeSummary } from "@/service/fees/fees.service";
import { flattenSP, pick } from "@/types/fees.format";
import type { Due, Meta, Payment } from "@/types/fees.interface";
import { MyDuesTable } from "@/components/modules/fees/members/MyDuesTable";
import { MyFeesNav } from "@/components/modules/fees/members/MyFeesNav";
import { MyFeesSummary, type MyFeeSummary } from "@/components/modules/fees/members/MyFeesSummary";
import { MyPaymentsTable } from "@/components/modules/fees/members/MyPaymentsTable";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export const metadata: Metadata = { title: "My fees" };

// Kept outside the component: the purity lint rejects Date.now() inside render.
// Safe here — this is a server component, evaluated once per request.
const getNow = () => Date.now();

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MyFeesPage({ searchParams }: Props) {
  const sp = flattenSP(await searchParams);
  const tab = sp.tab === "payments" ? "payments" : "dues";
  const now = getNow();

  // Summary + the active tab's list load in parallel.
  const [summaryRes, listRes] = await Promise.all([
    getMyFeeSummary(),
    tab === "dues"
      ? getFeeDues(pick(sp, ["page", "limit", "sortBy", "order", "status"], { limit: "10" }))
      : getFeePayments(pick(sp, ["page", "limit", "sortBy", "order"], { limit: "10" })),
  ]);

  const summary = summaryRes.data as MyFeeSummary;
  const error = listRes.success ? undefined : listRes.message;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">My fees</h1>
        <p className="mt-1 text-sm text-slate-400">Your dues, payments and what’s left to pay.</p>
      </div>

      <MyFeesSummary summary={summary} now={now} error={summaryRes.success ? undefined : summaryRes.message} />

      <MyFeesNav tab={tab} />

      {tab === "dues" ? (
        <MyDuesTable rows={listRes.data as Due[]} meta={listRes.meta as Meta | undefined} now={now} error={error} />
      ) : (
        <MyPaymentsTable rows={listRes.data as Payment[]} meta={listRes.meta as Meta | undefined} error={error} />
      )}
    </div>
  );
}