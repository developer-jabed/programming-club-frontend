/* eslint-disable @typescript-eslint/no-explicit-any */

export type TaskState =
  | "NOT_SUBMITTED"
  | "AWAITING_REVIEW"
  | "REVISION"
  | "REVIEWED";

export const STATE_LABEL: Record<TaskState, string> = {
  NOT_SUBMITTED: "Not submitted",
  AWAITING_REVIEW: "Awaiting review",
  REVISION: "Needs revision",
  REVIEWED: "Reviewed",
};

export const STATE_STYLE: Record<TaskState, string> = {
  NOT_SUBMITTED: "bg-muted text-muted-foreground",
  AWAITING_REVIEW: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  REVISION: "bg-destructive/15 text-destructive",
  REVIEWED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export const SUBMISSION_STYLE: Record<string, string> = {
  SUBMITTED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  ACCEPTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-destructive/15 text-destructive",
  CHANGES_REQUESTED: "bg-destructive/15 text-destructive",
};

/** True when the member is allowed to create a new submission */
export function canSubmitState(state: TaskState): boolean {
  return state === "NOT_SUBMITTED" || state === "REVISION";
}

/** Most recent submission (assumes backend returns them newest-first) */
export function latestSubmission(task: any) {
  const list = task?.submissions;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[0];
}

/**
 * Derive the member-facing state of a task from its submissions.
 *
 * Logic:
 * - no submissions          → NOT_SUBMITTED
 * - latest is SUBMITTED     → AWAITING_REVIEW
 * - latest is REJECTED /
 *   CHANGES_REQUESTED      → REVISION
 * - latest is ACCEPTED      → REVIEWED
 */
export function getTaskState(task: any): TaskState {
  const latest = latestSubmission(task);
  if (!latest) return "NOT_SUBMITTED";

  const status = (latest.status || "").toUpperCase();

  if (status === "SUBMITTED") return "AWAITING_REVIEW";
  if (status === "REJECTED" || status === "CHANGES_REQUESTED") return "REVISION";
  if (status === "ACCEPTED") return "REVIEWED";

  // Fallback – treat unknown statuses as awaiting review
  return "AWAITING_REVIEW";
}

export function isOverdue(task: any, now: number): boolean {
  if (!task?.dueDate) return false;
  const due = new Date(task.dueDate).getTime();
  return Number.isFinite(due) && due < now;
}

export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Hydration-safe formatters (fixed locale + options) ──────
const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FMT.format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return DATETIME_FMT.format(d);
}