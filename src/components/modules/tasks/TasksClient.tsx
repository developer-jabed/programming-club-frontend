/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search,
  CheckSquare,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteTask, updateTaskStatus } from "@/service/task/task.service";
import TaskFormModal from "./CreateTaskModal";
import TaskSubmissionsModal from "./TaskSubmissionsModal";

interface Props {
  tasks: any[];
  projects: any[];
  sectors: any[];
}

export default function TasksClient({ tasks, projects, sectors }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  // modal: null = closed, "new" = create, object = edit
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [submissionsTask, setSubmissionsTask] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search || t.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "ALL" || t.status === status;
      const matchPriority = priority === "ALL" || t.priority === priority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, status, priority]);

  const handleStatusChange = (id: string, next: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await updateTaskStatus(id, next);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
      setBusyId(null);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const id = deleting.id;
    startTransition(async () => {
      const res = await deleteTask(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button
          onClick={() => setModal("new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:brightness-110 transition glow-primary"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <PriorityDot priority={t.priority} />

              <div className="flex-1 min-w-[180px]">
                <h3 className="font-medium text-foreground truncate">{t.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <StatusBadge status={t.status} />
                  {t.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(t.dueDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {t.maxScore != null && <span>{t.maxScore} pts</span>}
                  {t._count?.assignments != null && (
                    <span>{t._count.assignments} assigned</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {busyId === t.id && isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}

                <button
                  onClick={() => setSubmissionsTask(t)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Submissions
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
                    {t._count?.submissions ?? 0}
                  </span>
                </button>

                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  disabled={isPending}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button
                  onClick={() => setModal(t)}
                  className="rounded-lg p-2 hover:bg-muted"
                  aria-label="Edit task"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(t)}
                  className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TaskFormModal
          key={modal === "new" ? "new" : modal.id}
          task={modal === "new" ? null : modal}
          projects={projects}
          sectors={sectors}
          onClose={() => setModal(null)}
        />
      )}

      {submissionsTask && (
        <TaskSubmissionsModal
          key={submissionsTask.id}
          task={submissionsTask}
          onClose={() => setSubmissionsTask(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => !isPending && setDeleting(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <h2 className="font-semibold text-lg">Delete task?</h2>
            <p className="text-sm text-muted-foreground">
              &quot;{deleting.title}&quot; will be permanently deleted, including
              all of its submissions.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                disabled={isPending}
                className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const c: Record<string, string> = {
    URGENT: "bg-destructive shadow-[0_0_8px] shadow-destructive/50",
    HIGH: "bg-accent shadow-[0_0_8px] shadow-accent/40",
    MEDIUM: "bg-primary",
    LOW: "bg-muted-foreground",
  };
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full shrink-0 ${c[priority] || c.MEDIUM}`}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: "bg-muted text-muted-foreground",
    IN_PROGRESS: "bg-primary/15 text-primary",
    IN_REVIEW: "bg-accent/15 text-accent",
    COMPLETED: "bg-primary/20 text-primary",
    CANCELLED: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${map[status] || map.TODO}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}