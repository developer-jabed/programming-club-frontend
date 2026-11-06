/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import {
  deleteFeatureUpdate,
  updateFeatureUpdate,
} from "@/service/features/features.service";
import {
  Badge,
  Notice,
  Pagination,
  UPDATE_TYPES,
  VISIBILITIES,
  btnCls,
  fmtDate,
  inputCls,
  label,
  ui,
  useQueryParams,
} from "./shared";
import UpdateFormModal from "./UpdateFormModal";

export default function UpdatesPanel({ result }: { result: any }) {
  const { sp, set, isPending } = useQueryParams();
  const [editing, setEditing] = useState<any | "new" | null>(null);
  const [notice, setNotice] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const items: any[] = result?.data ?? [];

  const togglePin = (item: any) => {
    setBusyId(item.id);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("isPinned", item.isPinned ? "false" : "true");
      const res = await updateFeatureUpdate(item.id, null, fd);
      setNotice(res);
      setBusyId(null);
    });
  };

  const remove = (item: any) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    startTransition(async () => {
      const res = await deleteFeatureUpdate(item.id);
      setNotice(res);
      setBusyId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={`${inputCls} !w-auto`}
          value={sp.get("type") ?? ""}
          onChange={(e) => set({ type: e.target.value || undefined })}
        >
          <option value="">All types</option>
          {UPDATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {label(t)}
            </option>
          ))}
        </select>

        <select
          className={`${inputCls} !w-auto`}
          value={sp.get("visibility") ?? ""}
          onChange={(e) => set({ visibility: e.target.value || undefined })}
        >
          <option value="">Public + Members</option>
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {label(v)}
            </option>
          ))}
        </select>

        <button
          className={`${btnCls.primary} ml-auto`}
          onClick={() => setEditing("new")}
        >
          + New update
        </button>
      </div>

      <Notice result={notice} />
      {result && !result.success && (
        <Notice result={{ success: false, message: result.message }} />
      )}

      <div
        className={`${ui.card} overflow-hidden transition-opacity ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No updates found.
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <td className="max-w-xs px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {item.isPinned && <span title="Pinned">📌</span>}
                      <button
                        onClick={() => setEditing(item)}
                        className="truncate text-left font-medium text-gray-100 transition hover:text-emerald-400"
                      >
                        {item.title}
                      </button>
                    </div>
                    {item.tags?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.map((t: string) => (
                          <span
                            key={t}
                            className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-gray-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={item.type} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={item.visibility} />
                  </td>
                  <td className="px-4 py-3 text-gray-300">{item.version ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {item.author?.name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                    {fmtDate(item.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className={btnCls.ghost}
                        disabled={busyId === item.id}
                        onClick={() => togglePin(item)}
                      >
                        {item.isPinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        className={btnCls.ghost}
                        onClick={() => setEditing(item)}
                      >
                        Edit
                      </button>
                      <button
                        className={btnCls.danger}
                        disabled={busyId === item.id}
                        onClick={() => remove(item)}
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

      {editing && (
        <UpdateFormModal
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}