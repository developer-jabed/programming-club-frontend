/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  Badge,
  Modal,
  Notice,
  PRIORITIES,
  REQUEST_STATUSES,
  btnCls,
  fmtDate,
  inputCls,
  label,
} from "./shared";
import {
  createFeatureReply,
  deleteFeatureReply,
  getFeatureRequestById,
  updateFeatureRequest,
} from "@/service/features/features.service";

export default function RequestDetailModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // data আবার আনতে হলে এটা call করো
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    getFeatureRequestById(id).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.message ?? "Failed to load");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  return (
    <Modal title="Manage Feature Request" onClose={onClose} wide>
      {loading && <p className="py-10 text-center text-gray-400">Loading…</p>}
      {error && <Notice result={{ success: false, message: error }} />}

      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <section className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-white">{data.title}</h3>
              <Badge value={data.status} />
              <Badge value={data.priority} />
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-300">
              {data.description}
            </p>
            <p className="text-xs text-gray-500">
              By {data.createdBy?.name ?? "Unknown"} · {fmtDate(data.createdAt)} ·{" "}
              {data.votes ?? 0} votes
              {data.sector?.name ? ` · ${data.sector.name}` : ""}
              {data.project?.title ? ` · ${data.project.title}` : ""}
            </p>
            {data.resolvedAt && (
              <p className="text-xs text-gray-500">
                Resolved {fmtDate(data.resolvedAt)}
                {data.resolvedBy?.name ? ` by ${data.resolvedBy.name}` : ""}
              </p>
            )}
          </section>

          <AdminControls data={data} onDone={reload} />
          <Replies data={data} onChanged={reload} />

          {data.relatedUpdates?.length > 0 && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-white">
                Related updates
              </h4>
              <ul className="space-y-1">
                {data.relatedUpdates.map((u: any) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <Badge value={u.type} />
                    <span className="truncate">{u.title}</span>
                    {u.version && (
                      <span className="text-xs text-gray-500">v{u.version}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      {fmtDate(u.publishedAt ?? u.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Status / priority / admin note ───────────────────────────
function AdminControls({ data, onDone }: { data: any; onDone: () => void }) {
  // Action শেষ হলেই reload; আলাদা useEffect লাগে না
  const [state, action, pending] = useActionState(
    async (prev: any, formData: FormData) => {
      const res = await updateFeatureRequest(data.id, prev, formData);
      if (res?.success) onDone();
      return res;
    },
    null as any
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"
    >
      <h4 className="text-sm font-semibold text-white">Admin controls</h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-gray-400">Status</span>
          <select name="status" defaultValue={data.status} className={inputCls}>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-gray-400">Priority</span>
          <select name="priority" defaultValue={data.priority} className={inputCls}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-gray-400">Admin note</span>
        <textarea
          name="adminNote"
          rows={3}
          defaultValue={data.adminNote ?? ""}
          className={inputCls}
          placeholder="Internal / public response summary"
        />
      </label>

      <Notice result={state} />

      <button className={btnCls.primary} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

// ── Replies ──────────────────────────────────────────────────
function Replies({ data, onChanged }: { data: any; onChanged: () => void }) {
  const [replyTo, setReplyTo] = useState<any>(null);
  const [notice, setNotice] = useState<any>(null);
  const [, startTransition] = useTransition();

  // Success হলে reply-to clear + reload, সবই action এর ভেতরে।
  // Form এর uncontrolled field গুলো React 19 নিজেই action শেষে reset করে।
  const [state, action, pending] = useActionState(
    async (prev: any, formData: FormData) => {
      const res = await createFeatureReply(data.id, prev, formData);
      if (res?.success) {
        setReplyTo(null);
        onChanged();
      }
      return res;
    },
    null as any
  );

  const replies: any[] = data.replies ?? [];
  const byId = new Map(replies.map((r) => [r.id, r]));

  const remove = (replyId: string) => {
    if (!window.confirm("Delete this reply?")) return;
    startTransition(async () => {
      const res = await deleteFeatureReply(replyId, data.id);
      setNotice(res);
      if (res.success) onChanged();
    });
  };

  return (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold text-white">
        Replies ({replies.length})
      </h4>

      <Notice result={notice} />

      <ul className="space-y-3">
        {replies.length === 0 && (
          <li className="text-sm text-gray-500">No replies yet.</li>
        )}

        {replies.map((r) => {
          const parent = r.parentReplyId ? byId.get(r.parentReplyId) : null;
          return (
            <li
              key={r.id}
              className={`rounded-lg border p-3 ${
                r.isAdminReply
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-white/10 bg-white/[0.03]"
              } ${r.parentReplyId ? "ml-6" : ""}`}
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium text-gray-100">
                  {r.author?.name ?? "Unknown"}
                </span>
                {r.isAdminReply && (
                  <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-gray-950">
                    STAFF
                  </span>
                )}
                <span>{fmtDate(r.createdAt)}</span>
              </div>

              {parent && (
                <p className="mt-1 truncate border-l-2 border-white/20 pl-2 text-xs text-gray-500">
                  ↪ {parent.author?.name}: {parent.content}
                </p>
              )}

              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                {r.content}
              </p>

              <div className="mt-2 flex gap-3 text-xs">
                <button
                  className="text-emerald-400 hover:underline"
                  onClick={() => setReplyTo(r)}
                >
                  Reply
                </button>
                <button
                  className="text-red-400 hover:underline"
                  onClick={() => remove(r.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <form action={action} className="space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-300">
            <span className="truncate">
              Replying to {replyTo.author?.name}: {replyTo.content}
            </span>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-white"
              onClick={() => setReplyTo(null)}
            >
              ✕
            </button>
          </div>
        )}

        <input type="hidden" name="parentReplyId" value={replyTo?.id ?? ""} />

        <textarea
          name="content"
          rows={3}
          className={inputCls}
          placeholder="Write an admin reply…"
        />

        {state?.errors?.content && (
          <p className="text-xs text-red-400">{state.errors.content}</p>
        )}
        {state && !state.success && !state.errors?.content && (
          <Notice result={state} />
        )}

        <button className={btnCls.primary} disabled={pending}>
          {pending ? "Sending…" : "Send reply"}
        </button>
      </form>
    </section>
  );
}