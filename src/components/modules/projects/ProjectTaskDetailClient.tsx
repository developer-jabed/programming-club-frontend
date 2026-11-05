"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquareText,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteSubmission,
  submitTask,
  updateSubmission,
} from "@/service/task/task.service";
import {
  STATE_LABEL,
  STATE_STYLE,
  canSubmitState,
  formatDate,
  formatDateTime,
  getTaskState,
  isHttpUrl,
  isOverdue,
  latestSubmission,
  type TaskState,
} from "@/components/modules/tasks/task-utils";
import { isProjectOwner } from "@/service/project/project-access";

interface Props {
  project: any;
  task: any;
  currentUserId?: string | null;
  now: number;
}

// ─────────────────────────────────────────────────────────────
// Submit / Edit form
// ─────────────────────────────────────────────────────────────
function SubmissionForm({
  task,
  initial,
  onDone,
  onCancel,
}: {
  task: any;
  initial: any | null;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initial?.content ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [files, setFiles] = useState(
    (initial?.fileUrls ?? []).join("\n")
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const contentTrim = content.trim();
    const linkTrim = link.trim();
    const fileUrls = files
      .split(/[\n,]/)
      .map((u: string) => u.trim())
      .filter(Boolean);

    if (!contentTrim && !linkTrim && fileUrls.length === 0) {
      setError("Add a note, a link, or at least one file link.");
      return;
    }
    if (linkTrim && !isHttpUrl(linkTrim)) {
      setError("The link must start with http:// or https://");
      return;
    }
    if (fileUrls.some((u: string) => !isHttpUrl(u))) {
      setError("Every file link must start with http:// or https://");
      return;
    }
    setError(null);

    startTransition(async () => {
      let res: any;

      if (initial) {
        res = await updateSubmission(initial.id, {
          content: contentTrim || null,
          link: linkTrim || null,
          fileUrls,
        });
      } else {
        const fd = new FormData();
        fd.set("content", contentTrim);
        fd.set("link", linkTrim);
        fd.set("fileUrls", fileUrls.join("\n"));
        res = await submitTask(task.id, null, fd);
      }

      if (res.success) {
        toast.success(
          res.message || (initial ? "Submission updated" : "Task submitted")
        );
        router.refresh();
        onDone();
      } else {
        toast.error(res.message || "Failed to save submission");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Upload className="h-4 w-4 text-primary" />
        {initial ? "Edit your submission" : "Submit your work"}
      </h2>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Notes / answer
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Describe what you did, or paste your answer..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Link (GitHub, Drive, live demo…)
          </label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            File links (one per line)
          </label>
          <textarea
            value={files}
            onChange={(e) => setFiles(e.target.value)}
            rows={3}
            placeholder={"https://drive.google.com/...\nhttps://..."}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        <button
          onClick={submit}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:brightness-110 disabled:opacity-50 transition"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {initial ? "Save changes" : "Submit"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function ProjectTaskDetailClient({
  project,
  task,
  currentUserId,
  now,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const state: TaskState = getTaskState(task);
  const latest = latestSubmission(task);
  const canSubmit = canSubmitState(state);
  const overdue = isOverdue(task, now) && canSubmit;
  const isOwner = isProjectOwner(project, currentUserId);

  const mySubmissions = useMemo(() => {
    if (!currentUserId) return [] as any[];
    return (task.submissions || [])
      .filter(
        (s: any) =>
          s.userId === currentUserId || s.user?.id === currentUserId
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.submittedAt || 0).getTime() -
          new Date(a.submittedAt || 0).getTime()
      );
  }, [task.submissions, currentUserId]);

  const editing = editingId
    ? mySubmissions.find((s: any) => s.id === editingId) ?? null
    : null;

  const latestEditable =
    !!latest &&
    (latest.status === "SUBMITTED" ||
      latest.status === "AWAITING_REVIEW" ||
      !latest.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to project
      </Link>

      {/* Task header */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${STATE_STYLE[state]}`}
          >
            {STATE_LABEL[state]}
          </span>
          {task.priority && (
            <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
              {task.priority}
            </span>
          )}
          {overdue && (
            <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
              Overdue
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.title}</p>
        </div>

        {task.description && (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Due {formatDate(task.dueDate)}
            </span>
          )}
          {task.maxScore != null && (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {task.maxScore} points
            </span>
          )}
          {task.createdBy?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Created by {task.createdBy.name}
            </span>
          )}
        </div>
      </div>

      {/* Reviewer’s Mark */}
      {latest && (latest.score != null || latest.feedback) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reviewer’s Mark
              </p>
              {latest.score != null ? (
                <p className="mt-1 text-3xl font-bold text-primary">
                  {latest.score}
                  <span className="text-base font-medium text-muted-foreground">
                    {" "}
                    / {task.maxScore ?? 100}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Score not yet assigned
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {latest.status && (
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {latest.status}
                </span>
              )}
              {latest.reviewedBy?.name && (
                <span className="text-[11px] text-muted-foreground">
                  by {latest.reviewedBy.name}
                </span>
              )}
            </div>
          </div>

          {latest.feedback && (
            <div className="mt-4 flex gap-2 rounded-xl bg-background/60 p-3.5 text-sm">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Feedback
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {latest.feedback}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New submission */}
      {canSubmit && !editing && (
        <SubmissionForm
          key="new"
          task={task}
          initial={null}
          onDone={() => undefined}
        />
      )}

      {/* Edit form */}
      {editing && (
        <SubmissionForm
          key={editing.id}
          task={task}
          initial={editing}
          onDone={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* History */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Your Submissions</h2>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {mySubmissions.length}
          </span>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto mb-3 h-8 w-8 opacity-40" />
            No submissions yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mySubmissions.map((sub: any, idx: number) => {
              const isLatest = idx === 0;
              const editable =
                isLatest &&
                latestEditable &&
                (sub.status === "SUBMITTED" ||
                  sub.status === "AWAITING_REVIEW" ||
                  !sub.status);
              const hasMark = sub.score != null || !!sub.feedback;

              return (
                <HistoryItem
                  key={sub.id}
                  submission={sub}
                  maxScore={task.maxScore ?? 100}
                  index={mySubmissions.length - idx}
                  editable={editable && !editing}
                  onEdit={() => setEditingId(sub.id)}
                  hasMark={hasMark}
                />
              );
            })}
          </div>
        )}
      </div>

      {state === "AWAITING_REVIEW" && !editing && (
        <p className="text-center text-xs text-muted-foreground">
          Your work is waiting to be reviewed. You can edit it until it is
          marked.
        </p>
      )}

      {isOwner && (
        <p className="text-center text-xs text-muted-foreground">
          You are the project owner. Submission review is available from the
          admin task panel.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History item
// ─────────────────────────────────────────────────────────────
function HistoryItem({
  submission,
  maxScore,
  index,
  editable,
  onEdit,
  hasMark,
}: {
  submission: any;
  maxScore: number;
  index: number;
  editable: boolean;
  onEdit: () => void;
  hasMark: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const res = await deleteSubmission(submission.id);
      if (res.success) {
        toast.success(res.message || "Submission deleted");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete submission");
      }
      setConfirming(false);
    });
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            #{index}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(submission.submittedAt)}
          </span>
          {submission.status && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              {String(submission.status).replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      {submission.content && (
        <p className="text-sm whitespace-pre-wrap text-foreground/90">
          {submission.content}
        </p>
      )}

      {submission.link &&
        (isHttpUrl(submission.link) ? (
          <a
            href={submission.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {submission.link}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground break-all">
            {submission.link}
          </span>
        ))}

      {Array.isArray(submission.fileUrls) &&
        submission.fileUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {submission.fileUrls.map((url: string, i: number) =>
              isHttpUrl(url) ? (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted transition"
                >
                  <Paperclip className="h-3 w-3" />
                  File {i + 1}
                </a>
              ) : null
            )}
          </div>
        )}

      {hasMark && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reviewer’s Mark
              </p>
              {submission.score != null ? (
                <p className="mt-0.5 text-xl font-bold text-primary">
                  {submission.score}
                  <span className="text-sm font-medium text-muted-foreground">
                    {" "}
                    / {maxScore}
                  </span>
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Score pending
                </p>
              )}
            </div>
            {submission.reviewedBy?.name && (
              <span className="text-[11px] text-muted-foreground">
                by {submission.reviewedBy.name}
              </span>
            )}
          </div>

          {submission.feedback && (
            <div className="mt-3 flex gap-2 rounded-lg bg-background/70 p-3 text-sm">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Feedback
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {submission.feedback}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {editable && (
        <div className="flex items-center gap-2 pt-1">
          {!confirming ? (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                Delete this submission?
              </span>
              <button
                onClick={remove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Yes, delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                No
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}