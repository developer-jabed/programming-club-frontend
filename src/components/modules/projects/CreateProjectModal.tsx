"use client";

import { useActionState, useEffect, useState } from "react";
import { createProject } from "@/service/project/project.service";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  sectors: any[];
}

export default function CreateProjectModal({ sectors }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProject, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Project created!");
      setOpen(false);
    } else if (state?.success === false) {
      toast.error(state.message || "Failed to create project");
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:brightness-110 transition glow-primary"
      >
        <Plus className="h-4 w-4" />
        New Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-lg">Create Project</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start a new collaborative project
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <Field label="Title" name="title" required placeholder="Awesome project name" />
          <Field
            label="Description"
            name="description"
            as="textarea"
            placeholder="What is this project about?"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" name="status" as="select" options={[
              { value: "OPEN", label: "Open" },
              { value: "DRAFT", label: "Draft" },
              { value: "IN_PROGRESS", label: "In Progress" },
            ]} />
            <Field
              label="Sector"
              name="sectorId"
              as="select"
              options={[
                { value: "", label: "None" },
                ...sectors.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Members" name="maxMembers" type="number" placeholder="Optional" />
            <Field label="Tags" name="tags" placeholder="react, node, api" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
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

function Field({
  label,
  name,
  required,
  placeholder,
  type = "text",
  as,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  as?: "textarea" | "select";
  options?: { value: string; label: string }[];
}) {
  const base =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={base} />
      ) : as === "select" ? (
        <select name={name} className={base} defaultValue={options?.[0]?.value}>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}
