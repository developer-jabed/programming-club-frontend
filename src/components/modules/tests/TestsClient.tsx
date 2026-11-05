/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
  Clock,
  Award,
  HelpCircle,
  Users,
  Send,
  Lock,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  deleteTest,
  publishTest,
  updateTest,
} from "@/service/test/test.service";
import CreateTestModal from "./CreateTestModal";
import EditTestModal from "./EditTestModal";

interface Props {
  tests: any[];
  projects: any[];
  sectors: any[];
  members?: { id: string; name: string; email?: string }[];
}

export default function TestsClient({
  tests,
  projects,
  sectors,
  members = [],
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(
    () => ({
      total: tests.length,
      published: tests.filter((t) => t.status === "PUBLISHED").length,
      draft: tests.filter((t) => t.status === "DRAFT").length,
      attempts: tests.reduce((s, t) => s + (t._count?.attempts ?? 0), 0),
    }),
    [tests]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => {
      const matchSearch = !q || t.title?.toLowerCase().includes(q);
      const matchStatus = status === "ALL" || t.status === status;
      return matchSearch && matchStatus;
    });
  }, [tests, search, status]);

  const run = (
    id: string,
    fn: () => Promise<{ success: boolean; message?: string }>,
    after?: () => void
  ) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(res.message || "Done");
        after?.();
        router.refresh();
      } else {
        toast.error(res.message || "Failed");
      }
      setBusyId(null);
    });
  };

  const handlePublish = (t: any) => {
    if ((t._count?.questions ?? 1) === 0) {
      toast.error("Add questions before publishing");
      return;
    }
    run(t.id, () => publishTest(t.id));
  };

  const handleClose = (t: any) => {
    const fd = new FormData();
    fd.set("status", "CLOSED");
    run(t.id, () => updateTest(t.id, null, fd));
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const id = deleting.id;
    run(id, () => deleteTest(id), () => setDeleting(null));
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total tests" value={stats.total} />
        <Stat label="Published" value={stats.published} />
        <Stat label="Drafts" value={stats.draft} />
        <Stat label="Total attempts" value={stats.attempts} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:brightness-110 transition glow-primary"
        >
          New Test
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No tests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const busy = busyId === t.id && isPending;
            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {t.title}
                    </h3>
                    <StatusBadge status={t.status} />
                  </div>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {t.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {t._count?.questions ?? 0} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {t.totalMarks ?? 0} marks
                      {t.passingMarks != null && ` (pass ${t.passingMarks})`}
                    </span>
                    {t.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t.durationMinutes}m
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t._count?.assignments ?? 0} assigned ·{" "}
                      {t._count?.attempts ?? 0} attempts
                    </span>
                    {t.startAt && (
                      <span>
                        {format(new Date(t.startAt), "MMM d, h:mm a")}
                        {t.endAt &&
                          ` → ${format(new Date(t.endAt), "MMM d, h:mm a")}`}
                      </span>
                    )}
                    {t.project?.title && <span>Project: {t.project.title}</span>}
                    {t.sector?.name && <span>Sector: {t.sector.name}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {busy && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}

                  {t.status === "DRAFT" && (
                    <button
                      onClick={() => handlePublish(t)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Publish
                    </button>
                  )}
                  {t.status === "PUBLISHED" && (
                    <button
                      onClick={() => handleClose(t)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Close
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(t)}
                    className="rounded-lg p-2 hover:bg-muted"
                    aria-label="Edit test"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(t)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Delete test"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <CreateTestModal
          projects={projects}
          sectors={sectors}
          members={members}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <EditTestModal
          key={editing.id}
          test={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => !isPending && setDeleting(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <h2 className="font-semibold text-lg">Delete test?</h2>
            <p className="text-sm text-muted-foreground">
              &quot;{deleting.title}&quot; will be permanently deleted with all
              its questions and attempts.
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-primary/15 text-primary border-primary/25",
    DRAFT: "bg-muted text-muted-foreground border-border",
    CLOSED: "bg-accent/15 text-accent border-accent/25",
    ARCHIVED: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
        map[status] || map.DRAFT
      }`}
    >
      {status}
    </span>
  );
}