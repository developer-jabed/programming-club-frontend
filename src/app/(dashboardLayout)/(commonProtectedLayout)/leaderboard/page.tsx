import Link from "next/link";
import { getLeaderboard } from "@/service/analytics/analytics.service";
import { getUserInfo } from "@/service/auth/getUserInfo";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import {
  formatPoints,
  initialOf,
  normalizeLeaderboard,
  type LeaderboardEntry,
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

function pageHref(page: number) {
  return page <= 1 ? "?#ranking" : `?page=${page}#ranking`;
}

function Avatar({
  entry,
  className,
}: {
  entry: LeaderboardEntry;
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
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {entry.rank === place ? s.label : "Tied"} · #{entry.rank}
      </p>
    </li>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
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
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);
  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold tabular-nums transition-colors";
  const idle =
    "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09] hover:text-white";
  const disabled = "pointer-events-none border-white/5 text-slate-600";

  return (
    <nav
      aria-label="Leaderboard pagination"
      className="flex items-center justify-center gap-1.5"
    >
      {page > 1 ? (
        <Link
          href={pageHref(page - 1)}
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
            href={pageHref(item)}
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
          href={pageHref(page + 1)}
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

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, res, me] = await Promise.all([
    searchParams,
    getLeaderboard(),
    getUserInfo().catch(() => null),
  ]);

  const myId = (me as { id?: string } | null)?.id;
  const entries = res.success ? normalizeLeaderboard(res.data) : [];

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const topScore = entries[0]?.points ?? 0;
  const average = entries.length
    ? Math.round(entries.reduce((sum, e) => sum + e.points, 0) / entries.length)
    : 0;

  // Pagination (for rank 4 and below)
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const requested = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), totalPages)
    : 1;
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageRows = rest.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = rest.length ? startIndex + 1 : 0;
  const showingTo = startIndex + pageRows.length;

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
            Top performers across the club, ranked by points
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Refreshes every 2 minutes
        </p>
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
          <p className="text-base font-semibold text-white">No rankings yet</p>
          <p className="max-w-sm text-sm text-slate-400">
            Complete tasks and tests to earn points. The top members will show up
            here.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile icon={Users} label="Participants" value={formatPoints(entries.length)} />
            <StatTile icon={Trophy} label="Top score" value={formatPoints(topScore)} />
            <StatTile icon={TrendingUp} label="Average score" value={formatPoints(average)} />
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

          {/* Rest of the ranking — table + pagination */}
          {rest.length > 0 && (
            <section
              id="ranking"
              aria-label="Full ranking"
              className="scroll-mt-24 space-y-4"
            >
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        <th scope="col" className="w-20 px-5 py-3.5 text-center">
                          Rank
                        </th>
                        <th scope="col" className="px-3 py-3.5">
                          Member
                        </th>
                        <th
                          scope="col"
                          className="hidden px-3 py-3.5 md:table-cell"
                        >
                          Progress
                        </th>
                        <th
                          scope="col"
                          className="hidden px-3 py-3.5 lg:table-cell"
                        >
                          Details
                        </th>
                        <th scope="col" className="px-5 py-3.5 text-right">
                          Points
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.06]">
                      {pageRows.map((entry, i) => {
                        const isMe = entry.id === myId;
                        const pct =
                          topScore > 0
                            ? Math.max(3, (entry.points / topScore) * 100)
                            : 0;
                        const details = [
                          entry.meta,
                          ...entry.stats
                            .slice(0, 3)
                            .map((s) => `${s.value} ${s.label.toLowerCase()}`),
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <tr
                            key={entry.id}
                            className={cn(
                              "transition-colors duration-200 hover:bg-white/[0.04]",
                              "duration-300 animate-in fade-in fill-mode-both",
                              isMe && "bg-rose-500/[0.08] hover:bg-rose-500/[0.12]",
                            )}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            <td className="px-5 py-3.5 text-center text-sm font-bold tabular-nums text-slate-400">
                              #{entry.rank}
                            </td>

                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar entry={entry} className="h-10 w-10 text-sm" />
                                <div className="min-w-0">
                                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                                    <span className="max-w-[180px] truncate">
                                      {entry.name}
                                    </span>
                                    {isMe && (
                                      <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-300">
                                        You
                                      </span>
                                    )}
                                  </p>
                                  {entry.meta && (
                                    <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500 lg:hidden">
                                      {entry.meta}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="hidden px-3 py-3.5 md:table-cell">
                              <div className="h-1.5 w-full min-w-[120px] max-w-[220px] overflow-hidden rounded-full bg-white/[0.07]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>

                            <td className="hidden px-3 py-3.5 text-xs text-slate-500 lg:table-cell">
                              <span className="block max-w-[260px] truncate">
                                {details || "—"}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-right text-base font-bold tabular-nums text-white">
                              {formatPoints(entry.points)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs font-medium text-slate-500">
                  Showing {showingFrom}–{showingTo} of {rest.length} members
                  (rank 4 and below)
                </p>
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}