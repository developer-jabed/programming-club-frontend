/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  ClipboardList,
  Trophy,
  Bell,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import {
  formatPoints,
  type LeaderboardEntry,
  type LeaderboardMe,
} from "@/components/modules/leaderboard/leaderboardUtils";

interface Props {
  user: any;
  projects: any[];
  tasks: any[];
  tests: any[];
  leaderboard: LeaderboardEntry[];
  me?: LeaderboardMe | null;
  notifications: any[];
}

export default function MemberDashboard({
  user,
  projects,
  tasks,
  tests,
  leaderboard,
  me,
  notifications,
}: Props) {
  const pendingTasks = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  ).length;

  const topFive = (leaderboard || []).slice(0, 5);
  const myId: string | undefined = me?.id ?? user?.id;
  const meInTop = topFive.some((e) => e.id === myId);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            Welcome back
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {user?.name || "Member"}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-xl">
            Keep building. Check your tasks, join projects, and climb the leaderboard.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="h-5 w-5" />}
          label="Open Projects"
          value={projects.length}
          href="/projects"
        />
        <StatCard
          icon={<CheckSquare className="h-5 w-5" />}
          label="Active Tasks"
          value={pendingTasks}
          href="/tasks"
          accent
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Available Tests"
          value={tests.length}
          href="/tests"
        />
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          label="Notifications"
          value={notifications.length}
          href="/notifications"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects */}
        <section className="lg:col-span-2 space-y-4">
          <SectionHeader title="Open Projects" href="/projects" />
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <EmptyState message="No open projects yet" />
            ) : (
              projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {p.description || "No description"}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.members?.length ?? 0} members</span>
                    {p.tags?.slice(0, 2).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Leaderboard + Tasks */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-4">
            <SectionHeader
              title="Leaderboard"
              href="/leaderboard"
              icon={<Trophy className="h-4 w-4 text-primary" />}
            />
            <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>

            <div className="mt-3 space-y-2">
              {topFive.map((item) => (
                <LeaderRow key={item.id} item={item} isMe={item.id === myId} />
              ))}

              {topFive.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No rankings yet
                </p>
              )}
            </div>

            {/* my own position when I'm not in the top 5 */}
            {me && !meInTop && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-2 py-2">
                  <span className="w-6 text-center text-sm font-bold text-primary">
                    {me.rank ?? "–"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">You</p>
                    <p className="text-xs text-muted-foreground">
                      {me.rank
                        ? me.pointsToNext !== null
                          ? `${formatPoints(me.pointsToNext)} pts to the next rank`
                          : "Top of the board"
                        : "Complete an activity to get ranked"}
                    </p>
                  </div>
                  <RankMove
                    rankChange={me.rankChange}
                    isNew={me.isNew}
                  />
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {formatPoints(me.points)}
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <SectionHeader title="My Tasks" href="/tasks" />
            <div className="mt-3 space-y-2">
              {tasks.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
                >
                  <PriorityDot priority={t.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.status}</p>
                  </div>
                </Link>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No tasks assigned
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function LeaderRow({
  item,
  isMe,
}: {
  item: LeaderboardEntry;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${
        isMe ? "bg-primary/10" : "hover:bg-muted/50"
      }`}
    >
      <span className="w-6 text-center text-sm font-bold text-primary">
        {item.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.name}
          {isMe && (
            <span className="ml-1.5 text-[10px] font-bold uppercase text-primary">
              You
            </span>
          )}
        </p>
      </div>
      <RankMove rankChange={item.rankChange} isNew={item.isNew} />
      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
        {formatPoints(item.points)}
      </span>
    </div>
  );
}

/** ▲ / ▼ rank movement vs the previous period (hidden when there's no comparison) */
function RankMove({
  rankChange,
  isNew,
}: {
  rankChange: number | null;
  isNew: boolean;
}) {
  if (isNew) {
    return (
      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
        NEW
      </span>
    );
  }
  if (!rankChange) return null;

  const up = rankChange > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${
        up ? "text-emerald-500" : "text-destructive"
      }`}
      title={up ? "Moved up" : "Moved down"}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(rankChange)}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors ${
        accent ? "glow-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <Link
        href={href}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "bg-primary/15 text-primary border-primary/30",
    IN_PROGRESS: "bg-accent/15 text-accent border-accent/30",
    COMPLETED: "bg-muted text-muted-foreground border-border",
    DRAFT: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
        colors[status] || colors.DRAFT
      }`}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    URGENT: "bg-destructive",
    HIGH: "bg-accent",
    MEDIUM: "bg-primary",
    LOW: "bg-muted-foreground",
  };
  return (
    <span
      className={`h-2 w-2 rounded-full shrink-0 ${colors[priority] || colors.MEDIUM}`}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}