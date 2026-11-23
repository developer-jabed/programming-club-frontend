"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { cn, fmtMoney } from "@/types/fees.format";
import { Category } from "@/types/fees.interface";
import { Badge, EditIcon, Empty, ErrorBar, cardCls, iconBtn, thCls } from "./FeeClient";

const CategoryDialog = dynamic(() => import("./Dialogue").then((m) => m.CategoryDialog));

export function CategoriesManager({
  categories,
  error,
}: {
  categories: Category[];
  error?: string;
}) {
  const [editing, setEditing] = useState<Category | null>(null);

  return (
    <section className={cardCls}>
      {error && <ErrorBar>{error}</ErrorBar>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Type</th>
              <th className={cn(thCls, "text-right")}>Default amount</th>
              <th className={thCls}>Status</th>
              <th className={cn(thCls, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-white">{c.name}</div>
                  {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
                </td>
                <td className="px-5 py-3.5 text-slate-400">{c.type === "MONTHLY" ? "Monthly" : "One time"}</td>
                <td className="px-5 py-3.5 text-right font-medium tabular-nums text-white">
                  {c.amount ? fmtMoney(c.amount) : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <Badge value={c.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end">
                    <button
                      className={iconBtn.neutral}
                      title="Edit category"
                      aria-label="Edit category"
                      onClick={() => setEditing(c)}
                    >
                      <EditIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {categories.length === 0 && <Empty>No categories yet. Use “New category” to add the first one.</Empty>}
      {editing && <CategoryDialog category={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}