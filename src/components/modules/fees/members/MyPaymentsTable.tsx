// components/modules/fees/MyPaymentsTable.tsx
import { cn, fmtDate, fmtMoney, periodLabel } from "@/types/fees.format";
import type { Meta, Payment } from "@/types/fees.interface";
import { Badge, Empty, ErrorBar, Pagination, SortHeader, cardCls, thCls } from "../FeeClient";

export function MyPaymentsTable({
  rows,
  meta,
  error,
}: {
  rows: Payment[];
  meta?: Meta;
  error?: string;
}) {
  return (
    <section className={cardCls}>
      {error && <ErrorBar>{error}</ErrorBar>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr>
              <SortHeader field="receiptNo" label="Receipt" defaultBy="paidAt" />
              <th className={thCls}>Paid for</th>
              <SortHeader field="amount" label="Amount" defaultBy="paidAt" right />
              <SortHeader field="paidAt" label="Paid on" defaultBy="paidAt" />
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const voided = p.status === "VOIDED";
              const forWhat = p.due?.title ?? p.category.name;
              const sub = [forWhat !== p.category.name && p.category.name, periodLabel(p.due?.month, p.due?.year)]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={p.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium tabular-nums text-emerald-300">{p.receipt}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-slate-200">{forWhat}</div>
                    {sub && <div className="text-xs text-slate-500">{sub}</div>}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-3.5 text-right font-medium tabular-nums",
                      voided ? "text-slate-500 line-through" : "text-white"
                    )}
                  >
                    {fmtMoney(p.amount)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">{fmtDate(p.paidAt)}</td>
                  <td className="px-5 py-3.5">
                    <Badge value={p.status} />
                    {voided && p.voidReason && (
                      <div className="mt-1.5 max-w-[200px] text-xs text-slate-500">{p.voidReason}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <Empty>No payments yet.</Empty>}
      <Pagination meta={meta} />
    </section>
  );
}