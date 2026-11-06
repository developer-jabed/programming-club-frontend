/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useState } from "react";
import {
  createFeatureUpdate,
  updateFeatureUpdate,
} from "@/service/features/features.service";
import {
  Modal,
  Notice,
  UPDATE_TYPES,
  VISIBILITIES,
  btnCls,
  inputCls,
  label,
} from "./shared";

// ISO → <input type="datetime-local"> value (local time)
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

export default function UpdateFormModal({
  item,
  onClose,
}: {
  item: any | null; // null = create
  onClose: () => void;
}) {
  const isEdit = !!item;

  // Success হলে action এর ভেতরেই modal বন্ধ; আলাদা useEffect লাগে না
  const [state, formAction, pending] = useActionState(
    async (prev: any, formData: FormData) => {
      const res = isEdit
        ? await updateFeatureUpdate(item.id, prev, formData)
        : await createFeatureUpdate(prev, formData);
      if (res?.success) onClose();
      return res;
    },
    null as any
  );

  const [pinned, setPinned] = useState<boolean>(item?.isPinned ?? false);

  const err = (key: string) =>
    state?.errors?.[key] ? (
      <p className="mt-1 text-xs text-red-400">{state.errors[key]}</p>
    ) : null;

  return (
    <Modal title={isEdit ? "Edit update" : "New update"} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-gray-400">Title *</span>
          <input
            name="title"
            defaultValue={item?.title ?? ""}
            className={inputCls}
          />
          {err("title")}
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Type</span>
            <select
              name="type"
              defaultValue={item?.type ?? "FEATURE_UPDATE"}
              className={inputCls}
            >
              {UPDATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Visibility</span>
            <select
              name="visibility"
              defaultValue={item?.visibility ?? "PUBLIC"}
              className={inputCls}
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Version</span>
            <input
              name="version"
              defaultValue={item?.version ?? ""}
              placeholder="e.g. 1.4.0"
              className={inputCls}
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-gray-400">Content * (Markdown supported)</span>
          <textarea
            name="content"
            rows={10}
            defaultValue={item?.content ?? ""}
            className={`${inputCls} font-mono`}
          />
          {err("content")}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Tags (comma separated)</span>
            <input
              name="tags"
              defaultValue={(item?.tags ?? []).join(", ")}
              placeholder="attendance, result, bugfix"
              className={inputCls}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Publish date</span>
            <input
              type="datetime-local"
              name="publishedAt"
              defaultValue={toLocalInput(item?.publishedAt)}
              className={inputCls}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Related feature request ID</span>
            <input
              name="relatedFeatureRequestId"
              defaultValue={item?.relatedFeatureRequestId ?? ""}
              className={inputCls}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Sector ID</span>
            <input
              name="sectorId"
              defaultValue={item?.sectorId ?? ""}
              className={inputCls}
            />
          </label>
        </div>

   
        <input type="hidden" name="isPinned" value={pinned ? "true" : "false"} />
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-500"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          Pin this update to the top
        </label>

        <Notice result={state && !state.success ? state : null} />

        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <button type="button" className={btnCls.ghost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnCls.primary} disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Publish update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}