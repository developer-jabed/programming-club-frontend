// components/modules/fees/MyFeesSummary.tsx  (server component)
import { cn, fmtDate, fmtMoney, isOverdue, periodLabel } from "@/types/fees.format";
import type { Due } from "@/types/fees.interface";
import { Badge, cardCls } from "../FeeClient";

export type MyFeeSummary = {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  upcoming: Due[];
};

export function MyFeesSummary({
  summary,
  now,
  error,
}: {
  summary: MyFeeSummary;
  now: number;
  error?: string;
}) {
  const s = summary ?? { totalDue: 0, totalPaid: 0, outstanding: 0, upcoming: [] };
  const rate = s.totalDue > 0 ? Math.min(100, Math.round((s.totalPaid / s.totalDue) * 100)) : 0;
  const upcoming = (s.upcoming ?? []).slice(0, 5);

  const cards = [
    { label: "Total billed", value: fmtMoney(s.totalDue), sub: "Excludes waived dues" },
    { label: "Paid", value: fmtMoney(s.totalPaid), sub: `${rate}% of your dues`, tone: "text-emerald-300" },
    {
      label: "Outstanding",
      value: fmtMoney(s.outstanding),
      sub: s.outstanding > 0 ? "Still to pay" : "Nothing due",
      tone: s.outstanding > 0 ? "text-amber-300" : "text-white",
    },
  ];

  return (
    <section aria-label="Fee summary" className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={cn(cardCls, "p-5")}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", c.tone ?? "text-white")}>
              {c.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className={cn(cardCls, "p-5")}>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="font-medium tabular-nums text-emerald-300">{rate}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Next dues</p>

          {upcoming.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              You’re all paid up.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-white/5">
              {upcoming.map((d) => {
                const overdue = isOverdue(d, now);
                const period = periodLabel(d.month, d.year);
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{d.title ?? d.category.name}</p>
                      <p className="text-xs text-slate-500">
                        {[period, d.dueDate && `Due ${fmtDate(d.dueDate)}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {overdue && <Badge value="OVERDUE" />}
                      <span className={cn("font-medium tabular-nums", overdue ? "text-red-400" : "text-white")}>
                        {fmtMoney(Math.max(0, d.amount - d.paidAmount))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {upcoming.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">Payments are recorded by an admin once you pay in person.</p>
          )}
        </div>
      </div>
    </section>
  );
}