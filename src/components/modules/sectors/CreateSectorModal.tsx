"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createSector } from "@/service/sector/sector.service";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SectorFormFields from "./SectorFormFields";

type SectorState = Awaited<ReturnType<typeof createSector>> | null;

function CreateForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [, formAction, isPending] = useActionState(
    async (prev: SectorState, formData: FormData): Promise<SectorState> => {
      const result = await createSector(prev, formData);

      if (result?.success) {
        toast.success(result.message || "Sector created!");
        router.refresh();
        onClose();
      } else if (result?.success === false) {
        toast.error(result.message || "Failed to create sector");
      }

      return result;
    },
    null as SectorState
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />

        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">Create Sector</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <SectorFormFields />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
            >
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

export default function CreateSectorModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:brightness-110 transition glow-primary"
      >
        <Plus className="h-4 w-4" />
        New Sector
      </button>

      {open && <CreateForm onClose={() => setOpen(false)} />}
    </>
  );
}