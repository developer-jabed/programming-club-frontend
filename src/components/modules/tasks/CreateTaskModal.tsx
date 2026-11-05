/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTask, updateTask } from "@/service/task/task.service";

interface Props {
  task?: any | null;
  projects: any[];
  sectors: any[];
  onClose: () => void;
}

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export default function TaskFormModal({
  task,
  projects,
  sectors,
  onClose,
}: Props) {
  const isEdit = !!task;

  const [targetType, setTargetType] = useState(
    task?.targetType ?? "PROJECT_MEMBERS"
  );
  const [projectId, setProjectId] = useState(task?.projectId ?? "");
  const [sectorId, setSectorId] = useState(task?.sectorId ?? "");

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      // Ensure the latest values are sent
      formData.set("targetType", targetType);
      formData.set("projectId", projectId);
      formData.set("sectorId", sectorId);

      const res = isEdit
        ? await updateTask(task.id, null, formData)
        : await createTask(null, formData);

      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message || "Failed");
      }
      return res;
    },
    null as any
  );

  const titleError =
    typeof state?.errors?.title === "string" ? state.errors.title : null;

  const dueDefault = task?.dueDate
    ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">
            {isEdit ? "Edit Task" : "Create Task"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          action={formAction}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <label className={label}>Title *</label>
            <input
              name="title"
              required
              defaultValue={task?.title ?? ""}
              placeholder="Task title"
              className={input}
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={label}>Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
              placeholder="Details..."
              className={input}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={label}>Status</label>
              <select
                name="status"
                className={input}
                defaultValue={task?.status ?? "TODO"}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={label}>Priority</label>
              <select
                name="priority"
                className={input}
                defaultValue={task?.priority ?? "MEDIUM"}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date + Max Score */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={label}>Due Date</label>
              <input
                name="dueDate"
                type="datetime-local"
                defaultValue={dueDefault}
                className={input}
              />
            </div>
            <div className="space-y-1.5">
              <label className={label}>Max Score</label>
              <input
                name="maxScore"
                type="number"
                min={0}
                defaultValue={task?.maxScore ?? ""}
                placeholder="100"
                className={input}
              />
            </div>
          </div>

          {/* ─────────────── Assign to ─────────────── */}
          <div className="space-y-1.5">
            <label className={label}>Assign to</label>
            <select
              name="targetType"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className={input}
            >
              <option value="PROJECT_MEMBERS">
                All members of selected project
              </option>
              <option value="SECTOR_MEMBERS">
                All members of selected sector
              </option>
              <option value="ALL_MEMBERS">All members of the club</option>
              <option value="SPECIFIC_MEMBERS">
                Specific members (manual – not implemented yet)
              </option>
            </select>
          </div>

          {/* Project + Sector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={label}>
                Project{" "}
                {targetType === "PROJECT_MEMBERS" && (
                  <span className="text-destructive">*</span>
                )}
              </label>
              <select
                name="projectId"
                value={projectId}
                onChange={(e) => {
                  const value = e.target.value;
                  setProjectId(value);
                  if (value) setTargetType("PROJECT_MEMBERS");
                }}
                className={input}
                required={targetType === "PROJECT_MEMBERS"}
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title ?? p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={label}>
                Sector{" "}
                {targetType === "SECTOR_MEMBERS" && (
                  <span className="text-destructive">*</span>
                )}
              </label>
              <select
                name="sectorId"
                value={sectorId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSectorId(value);
                  if (value && !projectId) setTargetType("SECTOR_MEMBERS");
                }}
                className={input}
                required={targetType === "SECTOR_MEMBERS"}
              >
                <option value="">None</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground">
            {targetType === "PROJECT_MEMBERS" &&
              "Task will be automatically assigned to all active members of the selected project."}
            {targetType === "SECTOR_MEMBERS" &&
              "Task will be automatically assigned to all members of the selected sector."}
            {targetType === "ALL_MEMBERS" &&
              "Task will be assigned to every active member in the club."}
          </p>

          {/* Actions */}
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
              {isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}