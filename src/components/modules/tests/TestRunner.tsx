/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Flag,
  HelpCircle,
  Loader2,
  Play,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { startTestAttempt, submitTestAttempt } from "@/service/test/test.service";

// ─────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────
const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

// Stable shuffle per attempt (same order after refresh)
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const byOrder = (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0);
const isMultiple = (q: any) => q.type === "MULTIPLE_CHOICE";

// ─────────────────────────────────────────────────────────────
// root
// ─────────────────────────────────────────────────────────────
export default function TestRunner({
  test,
  attempt: initial,
}: {
  test: any;
  attempt: any | null;
}) {
  const [attempt, setAttempt] = useState<any | null>(initial);
  const mounted = useMounted();

  if (!attempt) return <Intro test={test} onStarted={setAttempt} />;

  if (attempt.status === "IN_PROGRESS") {
    if (!mounted) {
      return (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return <ActiveTest test={test} attempt={attempt} onDone={setAttempt} />;
  }

  // `initial` is refreshed from the server after submit and carries the review data
  const review = initial && initial.status !== "IN_PROGRESS" ? initial : null;
  return <ResultView test={test} summary={attempt} review={review} />;
}

// ─────────────────────────────────────────────────────────────
// intro / rules
// ─────────────────────────────────────────────────────────────
function Intro({
  test,
  onStarted,
}: {
  test: any;
  onStarted: (a: any) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // null until mounted: avoids server/client mismatch on time and date text
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);
  const ready = now !== null;

  const upcoming =
    ready && !!test.startAt && new Date(test.startAt).getTime() > now;
  const ended = ready && !!test.endAt && new Date(test.endAt).getTime() < now;
  const unavailable = test.status !== "PUBLISHED";
  const blocked = upcoming || ended || unavailable;
  const questionCount = test.questions?.length ?? 0;

  const start = () =>
    startTransition(async () => {
      const res = await startTestAttempt(test.id);
      if (res.success && res.data) {
        onStarted(res.data);
      } else {
        toast.error(res.message || "Could not start the test");
        router.refresh(); // it may already be started or submitted
      }
    });

  const stats = [
    { icon: HelpCircle, label: "Questions", value: questionCount },
    { icon: Award, label: "Total marks", value: test.totalMarks ?? 0 },
    {
      icon: Clock,
      label: "Duration",
      value: test.durationMinutes ? `${test.durationMinutes} min` : "No limit",
    },
    {
      icon: CheckCircle2,
      label: "Passing marks",
      value: test.passingMarks ?? "—",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All tests
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{test.title}</h1>
            {test.description && (
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                {test.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-background p-3"
              >
                <s.icon className="mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-bold leading-tight">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {ready && (test.startAt || test.endAt) && (
            <p className="text-sm text-muted-foreground">
              Available{" "}
              {test.startAt && format(new Date(test.startAt), "MMM d, h:mm a")}
              {test.endAt &&
                ` until ${format(new Date(test.endAt), "MMM d, h:mm a")}`}
            </p>
          )}

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-2 text-sm font-semibold">Before you begin</p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>You get one attempt. It cannot be restarted.</li>
              {test.durationMinutes && (
                <li>
                  The timer starts when you press Start and keeps running if you
                  close the page.
                </li>
              )}
              <li>Answers are saved on this device as you go.</li>
              <li>The test submits automatically when time runs out.</li>
              <li>
                You can flag questions and come back to them before submitting.
              </li>
            </ul>
          </div>

          {blocked && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {unavailable
                ? "This test is not available."
                : upcoming
                  ? "This test has not opened yet."
                  : "This test has ended."}
            </div>
          )}

          <button
            onClick={start}
            disabled={!ready || blocked || isPending || questionCount === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 glow-primary"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start test
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// the exam
// ─────────────────────────────────────────────────────────────
type Saved = { a: Record<string, string[]>; f: string[] };

function ActiveTest({
  test,
  attempt,
  onDone,
}: {
  test: any;
  attempt: any;
  onDone: (a: any) => void;
}) {
  const router = useRouter();
  const storeKey = `test:${test.id}:${attempt.id}`;

  const questions = useMemo(() => {
    const list = [...(test.questions ?? [])].sort(byOrder);
    if (test.shuffleQuestions) {
      const r = rng(attempt.id);
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [test.questions, test.shuffleQuestions, attempt.id]);

  const deadline = useMemo(() => {
    const ends: number[] = [];
    if (test.durationMinutes)
      ends.push(
        new Date(attempt.startedAt).getTime() + test.durationMinutes * 60000
      );
    if (test.endAt) ends.push(new Date(test.endAt).getTime());
    return ends.length ? Math.min(...ends) : null;
  }, [test.durationMinutes, test.endAt, attempt.startedAt]);

  const [saved, setSaved] = useState<Saved>(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const p = JSON.parse(raw);
        return { a: p.a ?? {}, f: p.f ?? [] };
      }
    } catch {}
    return { a: {}, f: [] };
  });
  const savedRef = useRef(saved);
  const doneRef = useRef(false);
  const autoRef = useRef(false);

  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (next: Saved) => {
    savedRef.current = next;
    setSaved(next);
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {}
  };

  const submit = useCallback(
    (auto = false) => {
      if (doneRef.current) return;
      doneRef.current = true;

      const answers = Object.entries(savedRef.current.a)
        .filter(([, v]) => v.length > 0)
        .map(([questionId, selectedOptions]) => ({
          questionId,
          selectedOptions,
        }));

      startTransition(async () => {
        const res = await submitTestAttempt(test.id, answers);
        if (res.success) {
          try {
            localStorage.removeItem(storeKey);
          } catch {}
          toast.success(
            auto
              ? "Time is up. Your answers were submitted."
              : res.message || "Test submitted"
          );
          const hide = test.showResultImmediately === false;
          onDone(hide ? { id: attempt.id, status: "SUBMITTED" } : res.data);
          router.refresh();
        } else {
          doneRef.current = false;
          setConfirmOpen(true);
          toast.error(res.message || "Failed to submit. Try again.");
        }
      });
    },
    [test.id, test.showResultImmediately, storeKey, attempt.id, onDone, router]
  );

  // Timer + auto-submit
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (deadline && t >= deadline && !autoRef.current) {
        autoRef.current = true;
        submit(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, submit]);

  // Warn before leaving mid-exam
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!doneRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  // Arrow-key navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(i + 1, questions.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [questions.length]);

  const q = questions[idx];
  const selected = saved.a[q.id] ?? [];
  const multiple = isMultiple(q);
  const options = [...(q.options ?? [])].sort(byOrder);

  const answeredCount = questions.filter(
    (x) => (saved.a[x.id]?.length ?? 0) > 0
  ).length;
  const flaggedCount = saved.f.length;
  const unanswered = questions.length - answeredCount;
  const remaining = deadline ? Math.max(0, deadline - now) : null;
  const urgent = remaining != null && remaining <= 5 * 60000;

  const choose = (optId: string) => {
    const next = multiple
      ? selected.includes(optId)
        ? selected.filter((x) => x !== optId)
        : [...selected, optId]
      : selected.includes(optId)
        ? []
        : [optId];
    update({ ...saved, a: { ...saved.a, [q.id]: next } });
  };

  const toggleFlag = () =>
    update({
      ...saved,
      f: saved.f.includes(q.id)
        ? saved.f.filter((x) => x !== q.id)
        : [...saved.f, q.id],
    });

  return (
    <div className="space-y-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate font-semibold">{test.title}</p>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        <div className="flex items-center gap-3">
          {remaining != null && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold tabular-nums ${
                urgent
                  ? "animate-pulse border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border bg-background"
              }`}
              role="timer"
            >
              <Clock className="h-4 w-4" />
              {clock(remaining)}
            </span>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* Question */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Question {idx + 1} of {questions.length} · {q.marks ?? 1}{" "}
              {(q.marks ?? 1) === 1 ? "mark" : "marks"}
            </p>
            <button
              onClick={toggleFlag}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                saved.f.includes(q.id)
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              {saved.f.includes(q.id) ? "Flagged" : "Flag for review"}
            </button>
          </div>

          <p className="whitespace-pre-wrap text-base font-medium leading-relaxed">
            {q.questionText}
          </p>

          {multiple && (
            <p className="text-xs text-muted-foreground">
              Select all that apply.
            </p>
          )}

          <div
            className="space-y-2"
            role={multiple ? "group" : "radiogroup"}
            aria-label="Answer options"
          >
            {options.map((o: any, i: number) => {
              const on = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  role={multiple ? "checkbox" : "radio"}
                  aria-checked={on}
                  onClick={() => choose(o.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${
                    on
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold ${
                      multiple ? "rounded-md" : "rounded-full"
                    } ${
                      on
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="whitespace-pre-wrap break-words">
                    {o.optionText}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              disabled={idx === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {selected.length > 0 && (
              <button
                onClick={() =>
                  update({ ...saved, a: { ...saved.a, [q.id]: [] } })
                }
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear answer
              </button>
            )}

            {idx < questions.length - 1 ? (
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
              >
                Review & submit
              </button>
            )}
          </div>
        </div>

        {/* Navigator */}
        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Questions
          </p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
            {questions.map((x: any, i: number) => {
              const answered = (saved.a[x.id]?.length ?? 0) > 0;
              const flagged = saved.f.includes(x.id);
              return (
                <button
                  key={x.id}
                  onClick={() => setIdx(i)}
                  aria-label={`Question ${i + 1}${answered ? ", answered" : ""}${flagged ? ", flagged" : ""}`}
                  className={`relative h-9 rounded-lg border text-xs font-semibold transition-colors ${
                    i === idx
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                      : ""
                  } ${
                    answered
                      ? "border-primary/40 bg-primary/20 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {i + 1}
                  {flagged && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-primary/40 bg-primary/20" />{" "}
              Answered
            </p>
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-border bg-background" />{" "}
              Not answered
            </p>
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Flagged
            </p>
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => !isPending && setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Submit test?</h2>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="font-semibold">{answeredCount}</span> of{" "}
                {questions.length} answered
              </p>
              {unanswered > 0 && (
                <p className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {unanswered} unanswered question{unanswered !== 1 && "s"}
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-muted-foreground">
                  {flaggedCount} flagged for review
                </p>
              )}
              <p className="text-muted-foreground">
                You cannot change answers after submitting.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Keep working
              </button>
              <button
                onClick={() => submit(false)}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// result + answer review
// ─────────────────────────────────────────────────────────────
function ResultView({
  test,
  summary,
  review,
}: {
  test: any;
  summary: any;
  review: any | null;
}) {
  const hidden = test.showResultImmediately === false;
  const data = review ?? summary;
  const score = data?.score ?? 0;
  const pct = Math.round((data?.percentage ?? 0) * 10) / 10;
  const passed = test.passingMarks != null ? score >= test.passingMarks : null;
  const answers: any[] = review?.answers ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All tests
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="space-y-4 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{test.title}</h1>
            <p className="text-sm text-muted-foreground">Test submitted</p>
          </div>

          {hidden ? (
            <p className="text-sm text-muted-foreground">
              Your answers were received. Results will be available after
              review.
            </p>
          ) : (
            <>
              <div>
                <p className="text-4xl font-bold tabular-nums">
                  {score}
                  <span className="text-xl text-muted-foreground">
                    {" "}
                    / {test.totalMarks}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{pct}%</p>
              </div>
              {passed != null && (
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    passed
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-destructive/30 bg-destructive/15 text-destructive"
                  }`}
                >
                  {passed ? "Passed" : "Not passed"}
                </span>
              )}
              {data?.timeTakenSec != null && (
                <p className="text-xs text-muted-foreground">
                  Time taken {clock(data.timeTakenSec * 1000)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {!hidden && answers.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Answer review</h2>
          {answers.map((a, i) => {
            const q = a.question ?? {};
            const chosen: string[] = Array.isArray(a.selectedOptions)
              ? a.selectedOptions
              : [];
            return (
              <div
                key={a.id ?? i}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-sm font-medium">
                    {i + 1}. {q.questionText}
                  </p>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${
                      a.isCorrect ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {a.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {a.marksObtained ?? 0}/{q.marks ?? 1}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[...(q.options ?? [])].sort(byOrder).map((o: any) => {
                    const picked = chosen.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                          o.isCorrect
                            ? "border-primary/40 bg-primary/10"
                            : picked
                              ? "border-destructive/40 bg-destructive/10"
                              : "border-border"
                        }`}
                      >
                        <span className="break-words">{o.optionText}</span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {picked && "Your answer"}
                          {picked && o.isCorrect && " · "}
                          {o.isCorrect && "Correct"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}