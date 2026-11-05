/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { updateTest } from "@/service/test/test.service";

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

// ISO -> value for <input type="datetime-local"> in the browser's timezone
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export default function EditTestModal({
  test,
  onClose,
}: {
  test: any;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState<string>(test.title || "");
  const [description, setDescription] = useState<string>(test.description || "");
  const [duration, setDuration] = useState<string>(
    test.durationMinutes != null ? String(test.durationMinutes) : ""
  );
  const [passing, setPassing] = useState<string>(
    test.passingMarks != null ? String(test.passingMarks) : ""
  );
  const [startAt, setStartAt] = useState(toLocalInput(test.startAt));
  const [endAt, setEndAt] = useState(toLocalInput(test.endAt));
  const [shuffle, setShuffle] = useState(String(test.shuffleQuestions ?? true));
  const [showResult, setShowResult] = useState(
    String(test.showResultImmediately ?? true)
  );
  const [status, setStatus] = useState<string>(test.status || "DRAFT");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Title is required");
    if (passing && test.totalMarks != null && Number(passing) > test.totalMarks)
      return toast.error(`Passing marks cannot exceed total (${test.totalMarks})`);
    if (startAt && endAt && new Date(endAt) <= new Date(startAt))
      return toast.error("End time must be after start time");

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("description", description);
    if (duration) fd.set("durationMinutes", duration);
    if (passing) fd.set("passingMarks", passing);
    if (startAt) fd.set("startAt", new Date(startAt).toISOString());
    if (endAt) fd.set("endAt", new Date(endAt).toISOString());
    fd.set("shuffleQuestions", shuffle);
    fd.set("showResultImmediately", showResult);
    fd.set("status", status);

    startTransition(async () => {
      const res = await updateTest(test.id, null, fd);
      if (res.success) {
        toast.success(res.message || "Test updated");
        router.refresh();
        onClose();
      } else {
        toast.error(res.message || "Failed to update test");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold">Edit Test</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <label className={label}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={input}
            />
          </div>
          <div className="space-y-1.5">
            <label className={label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={input}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={label}>Duration (min)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={input}
              />
            </div>
            <div className="space-y-1.5">
              <label className={label}>
                Passing marks (of {test.totalMarks ?? 0})
              </label>
              <input
                type="number"
                min={0}
                value={passing}
                onChange={(e) => setPassing(e.target.value)}
                className={input}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={label}>Starts at</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={input}
              />
            </div>
            <div className="space-y-1.5">
              <label className={label}>Ends at</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className={input}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className={label}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={input}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={label}>Shuffle</label>
              <select
                value={shuffle}
                onChange={(e) => setShuffle(e.target.value)}
                className={input}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={label}>Show result</label>
              <select
                value={showResult}
                onChange={(e) => setShowResult(e.target.value)}
                className={input}
              >
                <option value="true">Immediately</option>
                <option value="false">After review</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Questions and assignments can&apos;t be edited after creation.
          </p>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 glow-primary"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}