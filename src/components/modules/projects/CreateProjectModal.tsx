"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/service/project/project.service";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProjectFormFields from "./ProjectFormFields";

type ProjectState = Awaited<ReturnType<typeof createProject>> | null;

function CreateForm({
  sectors,
  onClose,
}: {
  sectors: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();

  const [, formAction, isPending] = useActionState(
    async (prev: ProjectState, formData: FormData): Promise<ProjectState> => {
      const result = await createProject(prev, formData);

      if (result?.success) {
        toast.success(result.message || "Project created!");
        router.refresh();
        onClose();
      } else if (result?.success === false) {
        toast.error(result.message || "Failed to create project");
      }

      return result;
    },
    null as ProjectState
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-lg">Create Project</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start a new collaborative project
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <ProjectFormFields sectors={sectors} />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-60 transition glow-primary"
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

export default function CreateProjectModal({
  sectors,
}: {
  sectors: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:brightness-110 transition glow-primary"
      >
        <Plus className="h-4 w-4" />
        New Project
      </button>

      {open && <CreateForm sectors={sectors} onClose={() => setOpen(false)} />}
    </>
  );
}