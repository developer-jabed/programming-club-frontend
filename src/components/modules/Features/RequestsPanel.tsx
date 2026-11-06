/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";

import {
  Badge,
  Notice,
  Pagination,
  PRIORITIES,
  REQUEST_STATUSES,
  btnCls,
  fmtDate,
  inputCls,
  label,
  selectSmCls,
  ui,
  useQueryParams,
} from "./shared";
import RequestDetailModal from "./RequestDetailModal";
import {
  deleteFeatureRequest,
  updateFeatureRequest,
} from "@/service/features/features.service";

export default function RequestsPanel({ result }: { result: any }) {
  const { sp, set, isPending } = useQueryParams();
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const items: any[] = result?.data ?? [];

  const changeStatus = (id: string, status: string) => {
    setBusyId(id);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("status", status);
      const res = await updateFeatureRequest(id, null, fd);
      setNotice(res);
      setBusyId(null);
    });
  };

  const remove = (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    startTransition(async () => {
      const res = await deleteFeatureRequest(id);
      setNotice(res);
      setBusyId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex flex-1 gap-2 sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            set({ search: search.trim() || undefined });
          }}
        >
          <input
            className={inputCls}
            placeholder="Search title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={btnCls.primary} type="submit">
            Search
          </button>
        </form>

        <select
          className={`${inputCls} !w-auto`}
          value={sp.get("status") ?? ""}
          onChange={(e) => set({ status: e.target.value || undefined })}
        >
          <option value="">All status</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>

        <select
          className={`${inputCls} !w-auto`}
          value={sp.get("priority") ?? ""}
          onChange={(e) => set({ priority: e.target.value || undefined })}
        >
          <option value="">All priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {label(p)}
            </option>
          ))}
        </select>

        {(sp.get("search") || sp.get("status") || sp.get("priority")) && (
          <button
            className={btnCls.ghost}
            onClick={() => {
              setSearch("");
              set({ search: undefined, status: undefined, priority: undefined });
            }}
          >
            Clear
          </button>
        )}
      </div>

      <Notice result={notice} />
      {result && !result.success && (
        <Notice result={{ success: false, message: result.message }} />
      )}

      {/* Table */}
      <div
        className={`${ui.card} overflow-hidden transition-opacity ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-center">Votes</th>
                <th className="px-4 py-3 text-center">Replies</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    No feature requests found.
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <td className="max-w-xs px-4 py-3">
                    <button
                      onClick={() => setSelectedId(item.id)}
                      className="block max-w-full truncate text-left font-medium text-gray-100 transition hover:text-emerald-400"
                    >
                      {item.title}
                    </button>
                    {item.sector?.name && (
                      <span className="text-xs text-gray-500">
                        {item.sector.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {item.createdBy?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={selectSmCls}
                      value={item.status}
                      disabled={busyId === item.id}
                      onChange={(e) => changeStatus(item.id, e.target.value)}
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={item.priority} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {item.votes ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {item._count?.replies ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                    {fmtDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className={btnCls.ghost}
                        onClick={() => setSelectedId(item.id)}
                      >
                        Manage
                      </button>
                      <button
                        className={btnCls.danger}
                        disabled={busyId === item.id}
                        onClick={() => remove(item.id, item.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          meta={result?.meta}
          onPage={(page) => set({ page: String(page) })}
        />
      </div>

      {selectedId && (
        <RequestDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}