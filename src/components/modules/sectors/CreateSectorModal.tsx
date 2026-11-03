"use client";

import { useActionState, useEffect, useState } from "react";
import { createSector } from "@/service/sector/sector.service";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateSectorModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createSector, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Sector created!");
      setOpen(false);
    } else if (state?.success === false) {
      toast.error(state.message || "Failed");
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:brightness-110 transition glow-primary"
      >
        <Plus className="h-4 w-4" />
        New Sector
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">Create Sector</h2>
          <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Web Development"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="What is this sector about?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Icon
              </label>
              <input
                name="icon"
                placeholder="🚀"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Color
              </label>
              <input
                name="color"
                type="color"
                defaultValue="#10b981"
                className="w-full h-[38px] rounded-xl border border-border bg-background px-1 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-medium disabled:opacity-60 glow-primary"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
