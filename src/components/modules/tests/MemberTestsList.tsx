/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  HelpCircle,
  Search,
} from "lucide-react";

type AttemptInfo = {
  status: string;
  score: number | null;
  percentage: number | null;
};

type CardState = "SUBMITTED" | "IN_PROGRESS" | "OPEN" | "UPCOMING" | "ENDED";

// `now` is null until mounted, so server and first client render match.
function getState(
  t: any,
  attempt: AttemptInfo | undefined,
  now: number | null
): { key: CardState | null; label: string } {
  if (attempt && attempt.status !== "IN_PROGRESS")
    return { key: "SUBMITTED", label: "You have submitted this test" };
  if (attempt?.status === "IN_PROGRESS")
    return { key: "IN_PROGRESS", label: "Attempt in progress" };

  if (now === null) return { key: null, label: "" };

  if (t.startAt && new Date(t.startAt).getTime() > now)
    return {
      key: "UPCOMING",
      label: `Opens ${format(new Date(t.startAt), "MMM d, h:mm a")}`,
    };
  if (t.endAt && new Date(t.endAt).getTime() < now)
    return { key: "ENDED", label: "This test has ended" };
  return {
    key: "OPEN",
    label: t.endAt
      ? `Closes ${format(new Date(t.endAt), "MMM d, h:mm a")}`
      : "Open now",
  };
}

const badge: Record<CardState, { text: string; cls: string }> = {
  SUBMITTED: {
    text: "Submitted",
    cls: "bg-primary/15 text-primary border-primary/25",
  },
  IN_PROGRESS: {
    text: "In progress",
    cls: "bg-accent/15 text-accent border-accent/25",
  },
  OPEN: { text: "Open", cls: "bg-primary/15 text-primary border-primary/25" },
  UPCOMING: { text: "Soon", cls: "bg-accent/15 text-accent border-accent/25" },
  ENDED: { text: "Ended", cls: "bg-muted text-muted-foreground border-border" },
};

const btnText: Record<CardState, string> = {
  SUBMITTED: "See result",
  IN_PROGRESS: "Continue test",
  OPEN: "Open test",
  UPCOMING: "View details",
  ENDED: "View",
};

export default function MemberTestsList({
  tests,
  attempts = {},
}: {
  tests: any[];
  attempts?: Record<string, AttemptInfo>;
}) {
  const [search, setSearch] = useState("");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => !q || t.title?.toLowerCase().includes(q));
  }, [tests, search]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests..."
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No tests available</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const attempt = attempts[t.id];
            const s = getState(t, attempt, now);
            const showScore =
              s.key === "SUBMITTED" &&
              t.showResultImmediately !== false &&
              attempt?.score != null;

            return (
              <div
                key={t.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold text-foreground">
                    {t.title}
                  </h3>
                  {s.key && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge[s.key].cls}`}
                    >
                      {s.key === "SUBMITTED" && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {badge[s.key].text}
                    </span>
                  )}
                </div>

                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                  {t.description || "No description"}
                </p>

                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    {t._count?.questions ?? 0} questions
                  </span>
                  {t.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.durationMinutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {t.totalMarks ?? 0} marks
                  </span>
                </div>

                {showScore ? (
                  <p className="mb-4 text-sm font-semibold text-foreground">
                    Score: {attempt.score} / {t.totalMarks ?? 0}
                    {attempt.percentage != null && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({Math.round(attempt.percentage * 10) / 10}%)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="mb-4 min-h-4 text-xs text-muted-foreground">
                    {s.label}
                  </p>
                )}

                <Link
                  href={`/tests/${t.id}`}
                  className={`mt-auto inline-flex w-full justify-center rounded-xl py-2 text-sm font-medium transition hover:brightness-110 ${
                    s.key === "SUBMITTED" || s.key === "ENDED"
                      ? "border border-border bg-background text-foreground hover:bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {s.key ? btnText[s.key] : "Open test"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}