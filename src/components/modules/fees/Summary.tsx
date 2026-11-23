// components/modules/fees/Summary.tsx
import Link from "next/link";
import { getFeeSummary } from "@/service/fees/fees.service";
import { cn, fmtMoney } from "@/types/fees.format";
import { DUE_STATUSES, MONTHS, type Summary } from "@/types/fees.interface";
import { Badge, cardCls } from "./FeeClient";

export async function SummaryCards({
  year,
  month,
}: {
  year?: string;
  month?: string;
}) {
  const res = await getFeeSummary({
    year: year ? Number(year) : undefined,
    month: month ? Number(month) : undefined,
  });

  const s = (res.data ?? {
    collected: 0,
    paymentCount: 0,
    totalDue: 0,
    outstanding: 0,
    overdueCount: 0,
    dues: {},
  }) as Summary;

  const paidOnDues = Math.max(0, s.totalDue - s.outstanding);
  const rate =
    s.totalDue > 0
      ? Math.min(100, Math.round((paidOnDues / s.totalDue) * 100))
      : 0;

  const period =
    year && month
      ? `${MONTHS[Number(month) - 1]} ${year}`
      : year
        ? year
        : null;

  const href = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ tab: "dues", ...extra });
    if (year) p.set("year", year);
    if (month) p.set("month", month);
    return `?${p}`;
  };

  const cards = [
    {
      label: "Collected",
      value: fmtMoney(s.collected),
      sub: `${s.paymentCount} payments${period ? ` in ${period}` : ""}`,
      to: "?tab=payments",
    },
    {
      label: "Billed",
      value: fmtMoney(s.totalDue),
      sub: "Excludes waived dues",
      to: href({}),
    },
    {
      label: "Outstanding",
      value: fmtMoney(s.outstanding),
      sub: "Still to collect",
      to: href({}),
    },
    {
      label: "Overdue",
      value: String(s.overdueCount),
      sub: "Unpaid past due date",
      to: href({ overdue: "true" }),
      alert: s.overdueCount > 0,
    },
  ];

  return (
    <section aria-label="Summary" className="space-y-4">
      {!res.success && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
          {res.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.to}
            className={cn(
              cardCls,
              "p-5 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-emerald-300",
              c.alert && "border-red-400/30"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {c.label}
            </p>
            <p
              className={cn(
                "mt-2 text-3xl font-semibold tabular-nums tracking-tight",
                c.alert ? "text-red-400" : "text-white"
              )}
            >
              {c.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className={cn(cardCls, "p-5")}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="text-slate-400">
            Paid so far{period ? ` · ${period}` : ""}
          </span>
          <span className="font-medium tabular-nums text-white">
            {fmtMoney(paidOnDues)}{" "}
            <span className="font-normal text-slate-500">
              of {fmtMoney(s.totalDue)}
            </span>{" "}
            <span className="text-emerald-300">{rate}%</span>
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DUE_STATUSES.map((st) => {
            const x = s.dues?.[st];
            return (
              <Link
                key={st}
                href={href({ status: st })}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <Badge value={st} />
                <p className="mt-2.5 text-sm font-medium tabular-nums text-white">
                  {x?.count ?? 0} dues
                </p>
                <p className="text-xs tabular-nums text-slate-500">
                  {fmtMoney(x?.amount ?? 0)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SummarySkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[110px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
      <div className="h-[190px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
    </div>
  );
}