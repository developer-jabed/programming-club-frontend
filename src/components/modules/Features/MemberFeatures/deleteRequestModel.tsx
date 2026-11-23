"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteFeatureRequest } from "@/service/features/features.service";

export default function DeleteRequestButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!window.confirm("Delete this request?")) return;
    startTransition(async () => {
      const res = await deleteFeatureRequest(id);
      if (res.success) toast.success(res.message || "Deleted");
      else toast.error(res.message || "Failed to delete");
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label="Delete request"
      className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}