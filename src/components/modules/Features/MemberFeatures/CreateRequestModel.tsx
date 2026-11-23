/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createFeatureRequest } from "@/service/features/features.service";
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"]; // TODO: match your enum

const input =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export default function CreateRequestModal() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const close = () => {
    if (pending) return;
    setOpen(false);
    setErrors({});
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErrors({});

    startTransition(async () => {
      const res = await createFeatureRequest(null, fd);
      if (res.success) {
        toast.success(res.message || "Request submitted");
        form.reset();
        setOpen(false);
      } else {
        if ("errors" in res && res.errors) setErrors(res.errors as any);
        toast.error(res.message || "Failed to submit");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        New request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New feature request</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className={label}>
                  Title *
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className={input}
                  placeholder="Short summary"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className={label}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  required
                  className={input}
                  placeholder="What do you need and why?"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className={label}>
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="MEDIUM"
                  className={input}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p[0] + p.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}