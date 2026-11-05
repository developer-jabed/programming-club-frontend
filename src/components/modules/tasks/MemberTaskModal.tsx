"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  ExternalLink,
  FolderKanban,
  Loader2,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  User,
  X,
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
  SUBMISSION_STYLE,
  canSubmitState,
  formatDate,
  formatDateTime,
  getTaskState,
  isHttpUrl,
  isOverdue,
  latestSubmission,
} from "./task-utils";

// ─────────────────────────────────────────────────────────────
// Submit / edit form
// ─────────────────────────────────────────────────────────────
function SubmissionForm({
  task,
  initial,
  onDone,
  onCancel,
}: {
  task: any;
  initial: any | null; // null = new submission, object = editing
  onDone: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState<string>(initial?.content ?? "");
  const [link, setLink] = useState<string>(initial?.link ?? "");
  const [files, setFiles] = useState<string>((initial?.fileUrls ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const linkTrim = link.trim();
    const contentTrim = content.trim();
    const fileUrls = files
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (!contentTrim && !linkTrim && fileUrls.length === 0) {
      setError("Add a note, a link, or at least one file link.");
      return;
    }
    if (linkTrim && !isHttpUrl(linkTrim)) {
      setError("The link must start with http:// or https://");
      return;
    }
    if (fileUrls.some((u) => !isHttpUrl(u))) {
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
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-semibold">
        {initial ? "Edit your submission" : "Submit your work"}
      </p>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Notes / answer
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Describe what you did, or paste your answer..."
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Link (GitHub, Drive, live demo...)
        </label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          File links (one per line)
        </label>
        <textarea
          value={files}
          onChange={(e) => setFiles(e.target.value)}
          rows={3}
          placeholder={"https://drive.google.com/...\nhttps://..."}
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        <button
          onClick={submit}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {initial ? "Save changes" : "Submit"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// One entry in the submission history
// ─────────────────────────────────────────────────────────────
function HistoryItem({
  submission,
  maxScore,
  isLatest,
  onEdit,
}: {
  submission: any;
  maxScore: number;
  isLatest: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const editable = isLatest && submission.status === "SUBMITTED";

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
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Submitted {formatDateTime(submission.submittedAt)}
        </p>
        <div className="flex items-center gap-2">
          {submission.score != null && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {submission.score} / {maxScore}
            </span>
          )}
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
              SUBMISSION_STYLE[submission.status] || "bg-primary/15 text-primary"
            }`}
          >
            {submission.status?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {submission.content && (
        <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 text-sm">
          {submission.content}
        </p>
      )}

      {(submission.link || submission.fileUrls?.length > 0) && (
        <div className="flex flex-col gap-1.5 text-sm">
          {submission.link &&
            (isHttpUrl(submission.link) ? (
              <a
                href={submission.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-all text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {submission.link}
              </a>
            ) : (
              <span className="break-all text-muted-foreground">
                {submission.link}
              </span>
            ))}
          {(submission.fileUrls || []).map((url: string, i: number) =>
            isHttpUrl(url) ? (
              <a
                key={`${url}-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-all text-primary hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                File {i + 1}
              </a>
            ) : null
          )}
        </div>
      )}

      {submission.feedback && (
        <div className="rounded-lg border border-border p-3 text-sm">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Feedback
            {submission.reviewedBy?.name ? ` · ${submission.reviewedBy.name}` : ""}
          </p>
          <p className="whitespace-pre-wrap break-words">{submission.feedback}</p>
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

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────
export default function MemberTaskModal({
  task,
  now,
  onClose,
}: {
  task: any;
  now: number;
  onClose: () => void;
}) {
  const maxScore: number = task.maxScore ?? 100;
  const state = getTaskState(task);
  const latest = latestSubmission(task);
  const history: any[] = task.submissions ?? [];
  const overdue = isOverdue(task, now);
  const mayCreate = canSubmitState(state);

  // Which submission is being edited (null = none)
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId
    ? history.find((s) => s.id === editingId) ?? null
    : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 space-y-1.5">
            <span
              className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATE_STYLE[state]}`}
            >
              {STATE_LABEL[state]}
            </span>
            <h2 className="text-lg font-semibold leading-snug">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          {/* Task info */}
          <div className="space-y-3">
            {task.description && (
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Due {formatDate(task.dueDate)}
              </span>
              <span>{maxScore} points</span>
              {task.priority && (
                <span className="uppercase">{task.priority} priority</span>
              )}
              {task.project?.title && (
                <span className="inline-flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {task.project.title}
                </span>
              )}
              {task.createdBy?.name && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {task.createdBy.name}
                </span>
              )}
            </div>

            {overdue && mayCreate && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                This task is past its due date. You can still submit, but it may
                be marked late.
              </div>
            )}
          </div>

          {/* New submission / resubmission */}
          {mayCreate && (
            <SubmissionForm
              key={latest?.id ?? "new"}
              task={task}
              initial={null}
              onDone={() => undefined}
            />
          )}

          {/* Editing an existing submission */}
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
          {history.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your submissions ({history.length})
              </p>
              {history.map((s, i) => (
                <HistoryItem
                  key={s.id}
                  submission={s}
                  maxScore={maxScore}
                  isLatest={i === 0}
                  onEdit={() => setEditingId(s.id)}
                />
              ))}
            </div>
          )}

          {state === "AWAITING_REVIEW" && !editing && (
            <p className="text-center text-xs text-muted-foreground">
              Your work is waiting to be reviewed. You can edit it until it is
              marked.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}