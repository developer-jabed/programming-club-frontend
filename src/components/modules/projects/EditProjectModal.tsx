"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/service/project/project.service";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProjectFormFields, { type Project } from "./ProjectFormFields";

type UpdateState = Awaited<ReturnType<typeof updateProject>> | null;

export default function EditProjectModal({
  project,
  sectors,
  onClose,
}: {
  project: Project;
  sectors: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();

  const [, formAction, isPending] = useActionState(
    async (prev: UpdateState, formData: FormData): Promise<UpdateState> => {
      const result = await updateProject(project.id, prev, formData);

      if (result?.success) {
        toast.success(result.message || "Project updated!");
        router.refresh();
        onClose();
      } else if (result?.success === false) {
        toast.error(result.message || "Failed to update project");
      }

      return result;
    },
    null as UpdateState
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
          <h2 className="font-semibold text-lg">Edit Project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <ProjectFormFields project={project} sectors={sectors} />

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}