import Link from "next/link";
import { getLeaderboard } from "@/service/analytics/analytics.service";
import { getUserInfo } from "@/service/auth/getUserInfo";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Crown,
  FileCheck2,
  FolderKanban,
  LocateFixed,
  Medal,
  MessageSquare,
  Minus,
  Rocket,
  Search,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import {
  CATEGORIES,
  DEFAULT_PERIOD,
  PERIODS,
  RANKING_RULES,
  buildExample,
  deriveMe,
  formatDelta,
  formatPoints,
  formatRange,
  getPointRules,
  initialOf,
  normalizeLeaderboard,
  parsePeriod,
  type Category,
  type LeaderboardEntry,
  type Period,
} from "@/components/modules/leaderboard/leaderboardUtils";

export const dynamic = "force-dynamic"; // ← required because of cookies()

export const metadata: Metadata = { title: "Leaderboard" };

const PAGE_SIZE = 10;

type Place = 1 | 2 | 3;

const PLACE_STYLES: Record<
  Place,
  { ring: string; glow: string; badge: string; text: string; label: string }
> = {
  1: {
    ring: "ring-amber-300/70",
    glow: "from-amber-400/20 via-amber-400/5 to-transparent",
    badge: "from-amber-300 to-amber-500",
    text: "text-amber-300",
    label: "Champion",
  },
  2: {
    ring: "ring-slate-300/60",
    glow: "from-slate-300/15 via-slate-300/5 to-transparent",
    badge: "from-slate-200 to-slate-400",
    text: "text-slate-300",
    label: "Runner-up",
  },
  3: {
    ring: "ring-orange-400/60",
    glow: "from-orange-400/15 via-orange-400/5 to-transparent",
    badge: "from-orange-300 to-orange-600",
    text: "text-orange-300",
    label: "Third place",
  },
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  projects: FolderKanban,
  tasks: ClipboardCheck,
  tests: FileCheck2,
  badges: Award,
  chat: MessageSquare,
};

/* ───────────── helpers ───────────── */

/** Builds a compact page list like: 1 … 4 5 6 … 20 */
function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("ellipsis");

  items.push(total);
  return items;
}

/** Keeps the selected period and search in every link. */
function buildHref(period: Period, page = 1, q = "", hash = "") {
  const qs = new URLSearchParams();
  if (period !== DEFAULT_PERIOD) qs.set("period", period);
  if (q) qs.set("q", q);
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();
  return `${query ? `?${query}` : "?"}${hash}`;
}

/** "Projects 120, Tasks 30 …" for screen readers. */
function breakdownLabel(entry: Pick<LeaderboardEntry, "breakdown">) {
  return CATEGORIES.filter((c) => entry.breakdown[c.key] > 0)
    .map((c) => `${c.label} ${formatPoints(entry.breakdown[c.key])}`)
    .join(", ");
}

/** "64% projects": the category this member earns most from. */
function topSource(entry: LeaderboardEntry): string | null {
  if (!entry.points) return null;
  const best = CATEGORIES.reduce((a, c) =>
    entry.breakdown[c.key] > entry.breakdown[a.key] ? c : a,
  );
  const share = Math.round((entry.breakdown[best.key] / entry.points) * 100);
  return `${share}% ${best.label.toLowerCase()}`;
}

/* ───────────── small UI pieces ───────────── */

function Avatar({
  entry,
  className,
}: {
  entry: Pick<LeaderboardEntry, "name" | "avatar">;
  className?: string;
}) {
  return entry.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={entry.avatar}
      alt=""
      loading="lazy"
      className={cn("shrink-0 rounded-2xl object-cover", className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 font-bold text-white",
        className,
      )}
    >
      {initialOf(entry.name)}
    </span>
  );
}

/** ▲ 3 / ▼ 2 / — / NEW (hidden when there is no previous period) */
function Movement({
  entry,
}: {
  entry: Pick<LeaderboardEntry, "rankChange" | "isNew">;
}) {
  if (entry.isNew) {
    return (
      <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
        NEW
      </span>
    );
  }
  if (entry.rankChange === null) return null;
  if (entry.rankChange === 0) {
    return (
      <span className="inline-flex items-center text-slate-500" title="No change">
        <Minus className="h-3 w-3" aria-hidden />
        <span className="sr-only">No change</span>
      </span>
    );
  }

  const up = entry.rankChange > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      title={up ? "Moved up" : "Moved down"}
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums",
        up ? "text-emerald-400" : "text-rose-400",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(entry.rankChange)}
    </span>
  );
}

function Delta({
  value,
  percent,
  className,
}: {
  value: number | null;
  percent?: number | null;
  className?: string;
}) {
  if (value === null) return null;
  return (
    <span
      className={cn(
        "text-xs font-semibold tabular-nums",
        value > 0
          ? "text-emerald-400"
          : value < 0
            ? "text-rose-400"
            : "text-slate-500",
        className,
      )}
    >
      {formatDelta(value, percent)}
    </span>
  );
}

/** Stacked bar: where the member's points come from. */
function BreakdownBar({
  entry,
  className,
}: {
  entry: Pick<LeaderboardEntry, "points" | "breakdown">;
  className?: string;
}) {
  const total = entry.points || 1;
  return (
    <div
      role="img"
      aria-label={`Points by category: ${breakdownLabel(entry)}`}
      className={cn(
        "flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]",
        className,
      )}
    >
      {CATEGORIES.map((c) => {
        const v = entry.breakdown[c.key];
        if (!v) return null;
        return (
          <div
            key={c.key}
            title={`${c.label}: ${formatPoints(v)} pts`}
            className={c.bar}
            style={{ width: `${(v / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-400">
      {CATEGORIES.map((c) => (
        <li key={c.key} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", c.bar)} aria-hidden />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function PodiumCard({
  entry,
  place,
  isMe,
}: {
  entry: LeaderboardEntry;
  place: Place;
  isMe: boolean;
}) {
  const s = PLACE_STYLES[place];
  const Icon = place === 1 ? Crown : Medal;

  return (
    <li
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] px-4 pb-6 text-center backdrop-blur-sm",
        "duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
        place === 1
          ? "order-1 pt-8 md:order-2 md:pb-9"
          : place === 2
            ? "order-2 pt-6 md:order-1 md:mt-8"
            : "order-3 pt-6 md:mt-12",
      )}
      style={{ animationDelay: `${(place - 1) * 90}ms` }}
    >
      <div
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-40 bg-gradient-to-b", s.glow)}
      />

      <span
        className={cn(
          "relative mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-slate-900 shadow-lg",
          s.badge,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <Avatar
        entry={entry}
        className={cn(
          "relative ring-2 ring-offset-2 ring-offset-[#0A101C]",
          s.ring,
          place === 1 ? "h-20 w-20 text-3xl" : "h-16 w-16 text-2xl",
        )}
      />

      <p className="relative mt-4 w-full truncate text-base font-semibold text-white">
        {entry.name}
        {isMe && (
          <span className="ml-2 rounded-full bg-rose-500/20 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-rose-300">
            You
          </span>
        )}
      </p>
      {entry.meta && (
        <p className="relative mt-0.5 text-xs text-slate-400">{entry.meta}</p>
      )}

      <p
        className={cn(
          "relative mt-4 text-3xl font-bold tabular-nums tracking-tight",
          s.text,
        )}
      >
        {formatPoints(entry.points)}
      </p>
      <p className="relative mt-1 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>
          {entry.rank === place ? s.label : "Tied"} · #{entry.rank}
        </span>
        <Movement entry={entry} />
      </p>
      <Delta
        value={entry.pointsChange}
        percent={entry.percentChange}
        className="relative mt-1"
      />

      <BreakdownBar entry={entry} className="relative mt-4" />

      <dl className="relative mt-4 grid w-full grid-cols-4 gap-1 text-[11px] text-slate-500">
        <div>
          <dd className="text-sm font-bold tabular-nums text-slate-200">
            {formatPoints(entry.breakdown.projects)}
          </dd>
          <dt>project pts</dt>
        </div>
        <div>
          <dd className="text-sm font-bold tabular-nums text-slate-200">
            {entry.stats.tasksCompleted}
          </dd>
          <dt>tasks</dt>
        </div>
        <div>
          <dd className="text-sm font-bold tabular-nums text-slate-200">
            {entry.stats.avgTestPercent !== null
              ? `${entry.stats.avgTestPercent}%`
              : "—"}
          </dd>
          <dt>tests</dt>
        </div>
        <div>
          <dd className="text-sm font-bold tabular-nums text-slate-200">
            {entry.stats.activeDays}
          </dd>
          <dt>active days</dt>
        </div>
      </dl>
    </li>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        <p className="text-xl font-bold tabular-nums leading-tight text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  period,
  q,
}: {
  page: number;
  totalPages: number;
  period: Period;
  q: string;
}) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);
  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold tabular-nums transition-colors";
  const idle =
    "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09] hover:text-white";
  const disabled = "pointer-events-none border-white/5 text-slate-600";
  const href = (p: number) => buildHref(period, p, q, "#ranking");

  return (
    <nav
      aria-label="Leaderboard pagination"
      className="flex items-center justify-center gap-1.5"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          scroll={false}
          aria-label="Previous page"
          className={cn(base, idle)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span aria-disabled className={cn(base, disabled)}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </span>
      )}

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1 text-slate-500" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            scroll={false}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              base,
              item === page
                ? "border-transparent bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20"
                : idle,
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          scroll={false}
          aria-label="Next page"
          className={cn(base, idle)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span aria-disabled className={cn(base, disabled)}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}

/* ───────────── page ───────────── */

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; period?: string; q?: string }>;
}) {
  const {
    page: pageParam,
    period: periodParam,
    q: qParam,
  } = await searchParams;
  const period = parsePeriod(periodParam);
  const q = (qParam ?? "").trim().slice(0, 60);

  const [res, userInfo] = await Promise.all([
    // the backend caps `limit` at 100 members
    getLeaderboard({ period, limit: 100 }),
    getUserInfo().catch(() => null),
  ]);

  const view = normalizeLeaderboard(res.success ? res.data : null);
  const { entries, risingStars, summary, scoring, compared, range, comparedWith } =
    view;

  // Never trust a cached `me` that belongs to someone else.
  const viewerId = (userInfo as { id?: string } | null)?.id;
  const backendMe =
    view.me && (!viewerId || view.me.id === viewerId) ? view.me : null;
  const myId = viewerId ?? backendMe?.id;
  const me = backendMe ?? deriveMe(entries, myId);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Search (rank 4 and below). Ranks stay the real ranks.
  const needle = q.toLowerCase();
  const filtered = needle
    ? rest.filter((e) => e.name.toLowerCase().includes(needle))
    : rest;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requested = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), totalPages)
    : 1;
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filtered.length ? startIndex + 1 : 0;
  const showingTo = startIndex + pageRows.length;

  // "Find me" link: the page of the table that holds the viewer
  const myRestIndex = myId ? rest.findIndex((e) => e.id === myId) : -1;
  const findMeHref =
    myRestIndex >= 0
      ? buildHref(
          period,
          Math.floor(myRestIndex / PAGE_SIZE) + 1,
          "",
          `#row-${myId}`,
        )
      : null;

  const pointRules = scoring ? getPointRules(scoring) : [];
  const example = scoring ? buildExample(scoring) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-lg shadow-rose-500/20">
              <Trophy className="h-5 w-5" aria-hidden />
            </span>
            Leaderboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Ranked by overall activity. Projects count the most, then tasks,
            tests, badges and chat.{" "}
            <a
              href="#rules"
              className="font-medium text-rose-300 underline-offset-4 hover:underline"
            >
              See how ranking works
            </a>
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Refreshes every minute
        </p>
      </div>

      {/* Period tabs + range */}
      <div className="space-y-2">
        <nav aria-label="Time period" className="-mx-1 overflow-x-auto px-1">
          <ul className="inline-flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {PERIODS.map((p) => (
              <li key={p.value}>
                <Link
                  href={buildHref(p.value, 1, q)}
                  scroll={false}
                  aria-current={p.value === period ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    p.value === period
                      ? "bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {range && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <span className="font-medium text-slate-300">
              {formatRange(range)}
            </span>
            {compared && comparedWith && (
              <span>· compared with {formatRange(comparedWith)}</span>
            )}
          </p>
        )}
      </div>

      {/* Error */}
      {!res.success && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200"
        >
          <p className="font-semibold">Couldn&apos;t load the leaderboard</p>
          <p className="mt-1 text-rose-300/80">
            {"message" in res && res.message ? res.message : "Please try again."}
          </p>
        </div>
      )}

      {/* Empty */}
      {res.success && entries.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <Trophy className="h-10 w-10 text-slate-600" aria-hidden />
          <p className="text-base font-semibold text-white">
            No rankings for this period
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            Submit project work, complete tasks and tests, or take part in
            discussions to earn points. Try a longer period to see more.
          </p>
        </div>
      )}

      {/* My position */}
      {me && (
        <section
          aria-label="Your position"
          className="flex flex-wrap items-center gap-4 rounded-3xl border border-rose-400/20 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-amber-500/10 px-5 py-4"
        >
          <Avatar entry={me} className="h-12 w-12 text-lg" />
          <div className="min-w-[150px] flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-300">
              Your position
            </p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-bold tabular-nums text-white">
              {me.rank ? `#${me.rank}` : "Unranked"}
              <span className="text-base font-semibold text-slate-300">
                {formatPoints(me.points)} pts
              </span>
              <Movement entry={me} />
              <Delta value={me.pointsChange} percent={me.percentChange} />
            </p>
          </div>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <p className="text-sm text-slate-300">
              {me.pointsToNext !== null
                ? `${formatPoints(me.pointsToNext)} pts to the next rank`
                : me.rank
                  ? "You are at the top 🎉"
                  : "Complete an activity to get ranked"}
            </p>
            {findMeHref && (
              <Link
                href={findMeHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 underline-offset-4 hover:underline"
              >
                <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                Find me in the table
              </Link>
            )}
          </div>
          {me.points > 0 && (
            <div className="w-full space-y-2">
              <BreakdownBar entry={me} />
              <p className="text-xs text-slate-400">{breakdownLabel(me)}</p>
            </div>
          )}
        </section>
      )}

      {entries.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              icon={Users}
              label="Participants"
              value={`${formatPoints(summary.participants)} / ${formatPoints(summary.members)}`}
            />
            <StatTile
              icon={Trophy}
              label="Top score"
              value={formatPoints(summary.topScore)}
            />
            <StatTile
              icon={TrendingUp}
              label="Average score"
              value={formatPoints(summary.averagePoints)}
            />
            <StatTile
              icon={Zap}
              label="Total points"
              value={formatPoints(summary.totalPoints)}
            />
          </div>

          {/* Podium */}
          <ol
            aria-label="Top three"
            className="grid items-start gap-4 md:grid-cols-3"
          >
            {podium.map((entry, i) => (
              <PodiumCard
                key={entry.id}
                entry={entry}
                place={(i + 1) as Place}
                isMe={entry.id === myId}
              />
            ))}
          </ol>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* Rest of the ranking: search + table + pagination */}
            <section
              id="ranking"
              aria-label="Full ranking"
              className="scroll-mt-24 space-y-4"
            >
              {rest.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Legend />
                    <form
                      action=""
                      method="get"
                      role="search"
                      className="relative w-full sm:w-64"
                    >
                      {period !== DEFAULT_PERIOD && (
                        <input type="hidden" name="period" value={period} />
                      )}
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        aria-hidden
                      />
                      <input
                        type="search"
                        name="q"
                        defaultValue={q}
                        placeholder="Search member…"
                        aria-label="Search members"
                        className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/50 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                      />
                      {q && (
                        <Link
                          href={buildHref(period, 1, "", "#ranking")}
                          scroll={false}
                          aria-label="Clear search"
                          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      )}
                    </form>
                  </div>

                  {filtered.length > 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-left">
                          <caption className="sr-only">
                            Members ranked 4 and below
                          </caption>
                          <thead>
                            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              <th
                                scope="col"
                                className="w-24 px-5 py-3.5 text-center"
                              >
                                Rank
                              </th>
                              <th scope="col" className="px-3 py-3.5">
                                Member
                              </th>
                              <th
                                scope="col"
                                className="hidden px-3 py-3.5 md:table-cell"
                              >
                                Points mix
                              </th>
                              <th
                                scope="col"
                                className="hidden px-3 py-3.5 xl:table-cell"
                              >
                                Activity
                              </th>
                              <th
                                scope="col"
                                className="px-5 py-3.5 text-right"
                              >
                                Points
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-white/[0.06]">
                            {pageRows.map((entry, i) => {
                              const isMe = entry.id === myId;
                              const st = entry.stats;
                              const source = topSource(entry);
                              const activity = [
                                `${formatPoints(entry.breakdown.projects)} project pts`,
                                `${st.tasksCompleted} tasks`,
                                `${st.testsTaken} tests${
                                  st.avgTestPercent !== null
                                    ? ` (${st.avgTestPercent}%)`
                                    : ""
                                }`,
                                `${st.messages} msgs`,
                                `${st.activeDays} active days`,
                              ].join(" · ");

                              return (
                                <tr
                                  key={entry.id}
                                  id={`row-${entry.id}`}
                                  className={cn(
                                    "scroll-mt-28 transition-colors duration-200 hover:bg-white/[0.04]",
                                    "duration-300 animate-in fade-in fill-mode-both",
                                    isMe &&
                                      "bg-rose-500/[0.08] hover:bg-rose-500/[0.12]",
                                  )}
                                  style={{ animationDelay: `${i * 30}ms` }}
                                >
                                  <td className="px-5 py-3.5 text-center">
                                    <p className="text-sm font-bold tabular-nums text-slate-300">
                                      #{entry.rank}
                                    </p>
                                    <div className="mt-0.5 flex justify-center">
                                      <Movement entry={entry} />
                                    </div>
                                  </td>

                                  <td className="px-3 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <Avatar
                                        entry={entry}
                                        className="h-10 w-10 text-sm"
                                      />
                                      <div className="min-w-0">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-white">
                                          <span className="max-w-[160px] truncate">
                                            {entry.name}
                                          </span>
                                          {isMe && (
                                            <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-300">
                                              You
                                            </span>
                                          )}
                                        </p>
                                        {entry.meta && (
                                          <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500">
                                            {entry.meta}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="hidden px-3 py-3.5 md:table-cell">
                                    <BreakdownBar
                                      entry={entry}
                                      className="min-w-[110px] max-w-[200px]"
                                    />
                                    {source && (
                                      <p className="mt-1.5 text-[11px] text-slate-500">
                                        {source}
                                      </p>
                                    )}
                                  </td>

                                  <td className="hidden px-3 py-3.5 text-xs text-slate-500 xl:table-cell">
                                    <span className="block max-w-[260px] truncate">
                                      {activity}
                                    </span>
                                  </td>

                                  <td className="px-5 py-3.5 text-right">
                                    <p className="text-base font-bold tabular-nums text-white">
                                      {formatPoints(entry.points)}
                                    </p>
                                    <Delta value={entry.pointsChange} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center text-sm text-slate-400">
                      No member matches &ldquo;{q}&rdquo; in ranks 4 and below.
                    </p>
                  )}

                  {filtered.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                      <p className="text-xs font-medium text-slate-500">
                        Showing {showingFrom}–{showingTo} of {filtered.length}{" "}
                        {q ? "matching members" : "members (rank 4 and below)"}
                        {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
                      </p>
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        period={period}
                        q={q}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
                  Only the top three have points in this period.
                </p>
              )}
            </section>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-6">
              {compared && (
                <section
                  aria-label="Rising stars"
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Rocket className="h-4 w-4 text-amber-300" aria-hidden />
                    Rising stars
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Biggest point jump vs the previous period
                  </p>

                  {risingStars.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Nothing to show yet.
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {risingStars.map((e, i) => (
                        <li key={e.id} className="flex items-center gap-3">
                          <span className="w-4 text-xs font-bold text-slate-500">
                            {i + 1}
                          </span>
                          <Avatar entry={e} className="h-8 w-8 text-xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {e.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Rank #{e.rank}
                              {e.isNew && " · new"}
                            </p>
                          </div>
                          <Delta value={e.pointsChange} percent={e.percentChange} />
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}

              <section
                aria-label="Points at a glance"
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BookOpen className="h-4 w-4 text-rose-300" aria-hidden />
                  Points at a glance
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
                  {pointRules.map((r) => {
                    const c = CATEGORIES.find((x) => x.key === r.key)!;
                    return (
                      <li key={r.key} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                            c.bar,
                          )}
                          aria-hidden
                        />
                        <span>
                          <b className="font-semibold text-white">
                            {c.label}:
                          </b>{" "}
                          {r.headline}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <a
                  href="#rules"
                  className="mt-4 inline-block text-xs font-semibold text-rose-300 underline-offset-4 hover:underline"
                >
                  Read the full rules
                </a>
              </section>
            </aside>
          </div>
        </>
      )}

      {/* Full rules */}
      {scoring && (
        <section
          id="rules"
          aria-labelledby="rules-title"
          className="scroll-mt-24 space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div>
            <h2
              id="rules-title"
              className="flex items-center gap-3 text-xl font-bold tracking-tight text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                <BookOpen className="h-4.5 w-4.5" aria-hidden />
              </span>
              How ranking works
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Every member is scored on all of their activity. Each kind of work
              is weighted by how much it should matter, and the total decides
              the rank. These rules are read live from the scoring engine.
            </p>
          </div>

          {/* Point sources */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pointRules.map((r) => {
              const c = CATEGORIES.find((x) => x.key === r.key)!;
              const Icon = CATEGORY_ICONS[r.key];
              return (
                <article
                  key={r.key}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl text-slate-900",
                          c.bar,
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {c.label}
                        </h3>
                        <p className="text-xs tabular-nums text-slate-400">
                          {r.headline}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      {c.weight}
                    </span>
                  </header>
                  <ul className="mt-4 space-y-2 text-xs leading-relaxed text-slate-400">
                    {r.details.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600"
                          aria-hidden
                        />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}

            {/* Worked example */}
            {example && (
              <article className="rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 to-amber-500/5 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Worked example
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  One member, one period, today&apos;s weights
                </p>
                <ul className="mt-4 space-y-2 text-xs">
                  {example.rows.map((row) => {
                    const c = CATEGORIES.find((x) => x.key === row.key)!;
                    return (
                      <li
                        key={row.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-2 text-slate-300">
                          <span
                            className={cn("h-2 w-2 shrink-0 rounded-full", c.bar)}
                            aria-hidden
                          />
                          {row.label}
                        </span>
                        <span className="font-semibold tabular-nums text-white">
                          +{formatPoints(row.points)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-bold text-white">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatPoints(example.total)} pts
                  </span>
                </p>
              </article>
            )}
          </div>

          {/* Ranking rules */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Ranking rules
            </h3>
            <dl className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
              {RANKING_RULES.map((rule, i) => (
                <div key={rule.title} className="flex gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold tabular-nums text-slate-300"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-white">
                      {rule.title}
                    </dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-slate-400">
                      {rule.text}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}