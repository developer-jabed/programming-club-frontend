"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ClipboardCheck,
  ExternalLink,
  Loader2,
  Paperclip,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSubmissionSummary,
  getTaskSubmissions,
  reviewSubmission,
} from "@/service/task/task-submission.service";

// Must match Prisma SubmissionStatus (everything except SUBMITTED).
// enum: SUBMITTED, UNDER_REVIEW, ACCEPTED, CHANGES_REQUESTED, REJECTED
const REVIEW_STATUSES = [
  { value: "ACCEPTED", label: "Approved" },
  { value: "CHANGES_REQUESTED", label: "Needs revision" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-muted text-muted-foreground",
  UNDER_REVIEW: "bg-muted text-muted-foreground",
  ACCEPTED: "bg-primary/20 text-primary",
  REJECTED: "bg-destructive/15 text-destructive",
  CHANGES_REQUESTED: "bg-accent/15 text-accent",
};

const isSafeUrl = (u?: string | null) => !!u && /^https?:\/\//i.test(u);

const formatDateTime = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "—";

function SubmissionBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        STATUS_STYLES[status] || "bg-primary/15 text-primary"
      }`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// One submission + its marking form
// ─────────────────────────────────────────────────────────────
function SubmissionCard({
  submission,
  task,
  maxScore,
  onSaved,
}: {
  submission: any;
  task: any;
  maxScore: number;
  onSaved: (updated: any) => void;
}) {
  const reviewed = submission.status !== "SUBMITTED";

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(
    REVIEW_STATUSES.some((s) => s.value === submission.status)
      ? submission.status
      : REVIEW_STATUSES[0].value
  );
  const [score, setScore] = useState<string>(
    submission.score != null ? String(submission.score) : ""
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || "");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const scoreNum = score.trim() === "" ? undefined : Number(score);

    if (
      scoreNum !== undefined &&
      (!Number.isInteger(scoreNum) || scoreNum < 0 || scoreNum > maxScore)
    ) {
      toast.error(`Score must be a whole number between 0 and ${maxScore}`);
      return;
    }

    startTransition(async () => {
      const res = await reviewSubmission(
        submission.id,
        {
          status,
          score: scoreNum,
          feedback: feedback.trim() || undefined,
        },
        task.id
      );

      if (res.success) {
        toast.success(res.message || "Review saved");
        onSaved(res.data);
        setOpen(false);
      } else {
        toast.error(res.message || "Failed to save review");
      }
    });
  };

  const user = submission.user || {};

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{user.name || "Unnamed"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email}
            {user.group ? ` · ${user.group}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {submission.score != null && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {submission.score} / {maxScore}
            </span>
          )}
          <SubmissionBadge status={submission.status} />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Submitted {formatDateTime(submission.submittedAt)}
        {submission.reviewedAt && (
          <>
            {" "}
            · Reviewed {formatDateTime(submission.reviewedAt)}
            {submission.reviewedBy?.name ? ` by ${submission.reviewedBy.name}` : ""}
          </>
        )}
      </p>

      {/* Work */}
      {submission.content && (
        <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 text-sm">
          {submission.content}
        </p>
      )}

      {(submission.link || submission.fileUrls?.length > 0) && (
        <div className="flex flex-col gap-1.5 text-sm">
          {submission.link &&
            (isSafeUrl(submission.link) ? (
              <a
                href={submission.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline break-all"
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
            isSafeUrl(url) ? (
              <a
                key={`${url}-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline break-all"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                File {i + 1}
              </a>
            ) : null
          )}
        </div>
      )}

      {reviewed && submission.feedback && !open && (
        <div className="rounded-lg border border-border p-3 text-sm">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Feedback
          </p>
          <p className="whitespace-pre-wrap break-words">{submission.feedback}</p>
        </div>
      )}

      {/* Marking */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          {reviewed ? "Edit review" : "Review"}
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {REVIEW_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Score (max {maxScore})
              </label>
              <input
                type="number"
                min={0}
                max={maxScore}
                step={1}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Write feedback for the member..."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────
type ListState = {
  key: string; // the filter this result belongs to
  data: any[];
  error: string | null;
};

export default function TaskSubmissionsModal({
  task,
  onClose,
}: {
  task: any;
  onClose: () => void;
}) {
  const maxScore: number = task.maxScore ?? 100;

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [listState, setListState] = useState<ListState | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  // Bumped after a review is saved so the summary is fetched again
  const [summaryTick, setSummaryTick] = useState(0);

  // Loading is derived: no result yet for the current filter
  const listKey = statusFilter;
  const loading = listState?.key !== listKey;
  const submissions = listState?.key === listKey ? listState.data : [];
  const error = listState?.key === listKey ? listState.error : null;

  // List: setState only runs inside the .then callback, never synchronously
  useEffect(() => {
    let cancelled = false;

    const q = new URLSearchParams({
      limit: "100",
      sortBy: "submittedAt",
      sortOrder: "desc",
    });
    if (statusFilter !== "ALL") q.set("status", statusFilter);

    getTaskSubmissions(task.id, q.toString()).then((res) => {
      if (cancelled) return;
      setListState({
        key: statusFilter,
        data: res.success ? res.data ?? [] : [],
        error: res.success ? null : res.message || "Failed to load submissions",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [task.id, statusFilter]);

  // Summary
  useEffect(() => {
    let cancelled = false;

    getSubmissionSummary(task.id).then((res) => {
      if (cancelled) return;
      if (res.success) setSummary(res.data);
    });

    return () => {
      cancelled = true;
    };
  }, [task.id, summaryTick]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  const handleSaved = (updated: any) => {
    setListState((prev) =>
      prev
        ? {
            ...prev,
            data: prev.data.map((s) => (s.id === updated.id ? updated : s)),
          }
        : prev
    );
    setSummaryTick((t) => t + 1); // average score and counts changed
  };

  const avg =
    summary?.averageScore != null
      ? `${Math.round(summary.averageScore * 10) / 10} / ${maxScore}`
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Submissions
            </p>
            <h2 className="truncate text-lg font-semibold">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard label="Assigned" value={summary.assigned} />
              <StatCard label="Submitted" value={summary.submittedUsers} />
              <StatCard label="Not submitted" value={summary.notSubmitted} />
              <StatCard label="Marked" value={summary.marked} />
              <StatCard label="Avg score" value={avg} />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All status</option>
              <option value="SUBMITTED">Awaiting review</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No submissions found
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  task={task}
                  maxScore={maxScore}
                  onSaved={handleSaved}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}