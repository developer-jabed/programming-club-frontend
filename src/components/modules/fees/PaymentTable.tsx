"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useState } from "react";
import { cn, fmtDate, fmtMoney, periodLabel } from "@/types/fees.format";
import type { Meta, Payment } from "@/types/fees.interface";
import {
  Avatar,
  Badge,
  Empty,
  ErrorBar,
  Pagination,
  SortHeader,
  VoidIcon,
  cardCls,
  iconBtn,
  thCls,
} from "./FeeClient";

const VoidPaymentDialog = dynamic(() => import("./Dialogue").then((m) => m.VoidPaymentDialog));

const Row = memo(function Row({ p, onVoid }: { p: Payment; onVoid: (p: Payment) => void }) {
  const voided = p.status === "VOIDED";
  const forWhat = p.due?.title ?? p.category.name;
  const period = periodLabel(p.due?.month, p.due?.year);
  const who = [p.user.roll && `Roll ${p.user.roll}`, p.user.group, p.user.semester && `Sem ${p.user.semester}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
      <td className="whitespace-nowrap px-5 py-3.5 font-medium tabular-nums text-emerald-300">{p.receipt}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={p.user.name} />
          <div className="min-w-0">
            <div className="truncate font-medium text-white">{p.user.name ?? "—"}</div>
            {who && <div className="truncate text-xs text-slate-500">{who}</div>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="text-slate-200">{forWhat}</div>
        <div className="text-xs text-slate-500">
          {[forWhat !== p.category.name && p.category.name, period, !p.dueId && "No due linked"]
            .filter(Boolean)
            .join(" · ")}
        </div>
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
      <td className="px-5 py-3.5 text-slate-400">{p.receivedBy.name ?? "—"}</td>
      <td className="px-5 py-3.5">
        <Badge value={p.status} />
        {voided && (
          <div className="mt-1.5 max-w-[180px] text-xs text-slate-500">
            {p.voidReason}
            {p.voidedAt ? ` · ${fmtDate(p.voidedAt)}` : ""}
          </div>
        )}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex justify-end">
          {!voided && (
            <button
              className={iconBtn.danger}
              title="Void payment"
              aria-label="Void payment"
              onClick={() => onVoid(p)}
            >
              <VoidIcon />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export function PaymentsTable({ rows, meta, error }: { rows: Payment[]; meta?: Meta; error?: string }) {
  const [target, setTarget] = useState<Payment | null>(null);
  const onVoid = useCallback((p: Payment) => setTarget(p), []);

  return (
    <section className={cardCls}>
      {error && <ErrorBar>{error}</ErrorBar>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr>
              <SortHeader field="receiptNo" label="Receipt" defaultBy="paidAt" />
              <th className={thCls}>Member</th>
              <th className={thCls}>Paid for</th>
              <SortHeader field="amount" label="Amount" defaultBy="paidAt" right />
              <SortHeader field="paidAt" label="Paid on" defaultBy="paidAt" />
              <th className={thCls}>Received by</th>
              <th className={thCls}>Status</th>
              <th className={cn(thCls, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <Row key={p.id} p={p} onVoid={onVoid} />
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <Empty>No payments found for these filters.</Empty>}
      <Pagination meta={meta} />
      {target && <VoidPaymentDialog payment={target} onClose={() => setTarget(null)} />}
    </section>
  );
}