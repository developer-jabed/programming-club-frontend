// components/modules/fees/MyDuesTable.tsx
import { cn, fmtDate, fmtMoney, isOverdue, periodLabel } from "@/types/fees.format";
import type { Due, Meta } from "@/types/fees.interface";
import { Badge, Empty, ErrorBar, Pagination, SortHeader, cardCls, thCls } from "../FeeClient";

export function MyDuesTable({
  rows,
  meta,
  now,
  error,
}: {
  rows: Due[];
  meta?: Meta;
  now: number;
  error?: string;
}) {
  return (
    <section className={cardCls}>
      {error && <ErrorBar>{error}</ErrorBar>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr>
              <th className={thCls}>Fee</th>
              <SortHeader field="amount" label="Amount" defaultBy="createdAt" right />
              <th className={cn(thCls, "text-right")}>Paid</th>
              <SortHeader field="dueDate" label="Due date" defaultBy="createdAt" />
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const overdue = isOverdue(d, now);
              const pct = d.amount > 0 ? Math.min(100, Math.round((d.paidAmount / d.amount) * 100)) : 0;
              const name = d.title ?? d.category.name;
              const sub = [name !== d.category.name && d.category.name, periodLabel(d.month, d.year)]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={d.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white">{name}</div>
                    {sub && <div className="text-xs text-slate-500">{sub}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium tabular-nums text-white">{fmtMoney(d.amount)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="tabular-nums text-slate-400">{fmtMoney(d.paidAmount)}</div>
                    {d.status === "PARTIAL" && (
                      <div className="ml-auto mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-white/10" title={`${pct}% paid`}>
                        <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </td>
                  <td className={cn("whitespace-nowrap px-5 py-3.5", overdue ? "font-medium text-red-400" : "text-slate-400")}>
                    {fmtDate(d.dueDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge value={d.status} />
                      {overdue && <Badge value="OVERDUE" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <Empty>No dues to show.</Empty>}
      <Pagination meta={meta} />
    </section>
  );
}