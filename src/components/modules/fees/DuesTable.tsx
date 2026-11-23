"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useState } from "react";
import { cn, fmtDate, fmtMoney, isOverdue, periodLabel } from "@/types/fees.format";
import type { Category, Due, Meta } from "@/types/fees.interface";
import {
  Avatar,
  Badge,
  CardIcon,
  Empty,
  ErrorBar,
  Pagination,
  SortHeader,
  TrashIcon,
  WaiveIcon,
  cardCls,
  iconBtn,
  thCls,
} from "./FeeClient";

const RecordPaymentDialog = dynamic(() => import("./Dialogue").then((m) => m.RecordPaymentDialog));
const WaiveDialog = dynamic(() => import("./Dialogue").then((m) => m.WaiveDialog));
const DeleteDueDialog = dynamic(() => import("./Dialogue").then((m) => m.DeleteDueDialog));

type Kind = "pay" | "waive" | "delete";
type Dlg = { kind: Kind; due: Due } | null;

const Row = memo(function Row({
  due,
  now,
  onAction,
}: {
  due: Due;
  now: number;
  onAction: (kind: Kind, due: Due) => void;
}) {
  const open = due.status === "UNPAID" || due.status === "PARTIAL";
  const overdue = isOverdue(due, now);
  const pct = due.amount > 0 ? Math.min(100, Math.round((due.paidAmount / due.amount) * 100)) : 0;
  const period = periodLabel(due.month, due.year);
  const feeName = due.title ?? due.category.name;
  const meta = [due.user.roll && `Roll ${due.user.roll}`, due.user.group, due.user.semester && `Sem ${due.user.semester}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={due.user.name} />
          <div className="min-w-0">
            <div className="truncate font-medium text-white">{due.user.name ?? "—"}</div>
            {meta && <div className="truncate text-xs text-slate-500">{meta}</div>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="text-slate-200">{feeName}</div>
        <div className="text-xs text-slate-500">
          {[feeName !== due.category.name && due.category.name, period].filter(Boolean).join(" · ")}
        </div>
      </td>
      <td className="px-5 py-3.5 text-right font-medium tabular-nums text-white">{fmtMoney(due.amount)}</td>
      <td className="px-5 py-3.5 text-right">
        <div className="tabular-nums text-slate-400">{fmtMoney(due.paidAmount)}</div>
        {due.status === "PARTIAL" && (
          <div className="ml-auto mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-white/10" title={`${pct}% paid`}>
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
          </div>
        )}
      </td>
      <td className={cn("whitespace-nowrap px-5 py-3.5", overdue ? "font-medium text-red-400" : "text-slate-400")}>
        {fmtDate(due.dueDate)}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1.5">
          <Badge value={due.status} />
          {overdue && <Badge value="OVERDUE" />}
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-3.5">
        <div className="flex justify-end gap-1">
          {open && (
            <>
              <button
                className={iconBtn.ok}
                title="Record payment"
                aria-label="Record payment"
                onClick={() => onAction("pay", due)}
              >
                <CardIcon />
              </button>
              <button
                className={iconBtn.neutral}
                title="Waive due"
                aria-label="Waive due"
                onClick={() => onAction("waive", due)}
              >
                <WaiveIcon />
              </button>
            </>
          )}
          {/* The backend only allows deleting dues that never had payments. */}
          {due.paidAmount === 0 && (
            <button
              className={iconBtn.danger}
              title="Delete due"
              aria-label="Delete due"
              onClick={() => onAction("delete", due)}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export function DuesTable({
  rows,
  meta,
  categories,
  now,
  error,
}: {
  rows: Due[];
  meta?: Meta;
  categories: Category[];
  now: number;
  error?: string;
}) {
  const [dlg, setDlg] = useState<Dlg>(null);
  const onAction = useCallback((kind: Kind, due: Due) => setDlg({ kind, due }), []);
  const close = useCallback(() => setDlg(null), []);

  return (
    <section className={cardCls}>
      {error && <ErrorBar>{error}</ErrorBar>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr>
              <th className={thCls}>Member</th>
              <th className={thCls}>Fee</th>
              <SortHeader field="amount" label="Amount" defaultBy="createdAt" right />
              <th className={cn(thCls, "text-right")}>Paid</th>
              <SortHeader field="dueDate" label="Due date" defaultBy="createdAt" />
              <th className={thCls}>Status</th>
              <th className={cn(thCls, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <Row key={d.id} due={d} now={now} onAction={onAction} />
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <Empty>No dues match these filters. Clear them, or generate this month’s dues.</Empty>
      )}
      <Pagination meta={meta} />

      {dlg?.kind === "pay" && <RecordPaymentDialog due={dlg.due} categories={categories} onClose={close} />}
      {dlg?.kind === "waive" && <WaiveDialog due={dlg.due} onClose={close} />}
      {dlg?.kind === "delete" && <DeleteDueDialog due={dlg.due} onClose={close} />}
    </section>
  );
}