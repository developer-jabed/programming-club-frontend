/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import {
  Users,
  FolderKanban,
  Activity,
  Trophy,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface Props {
  stats: any;
  activities: any;
  leaderboard: any;
  users: any;
  projects: any;
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

export default function AdminDashboard({
  stats,
  activities,
  leaderboard,
  users,
  projects,
}: Props) {
  const usersList = toArray(users);
  const projectsList = toArray(projects);
  const activitiesList = toArray(activities);
  const leaderboardList = toArray(leaderboard);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Club overview and management snapshot
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Total Members"
          value={stats?.totalUsers ?? usersList.length}
        />
        <Stat
          icon={<FolderKanban className="h-5 w-5" />}
          label="Projects"
          value={stats?.totalProjects ?? projectsList.length}
        />
        <Stat
          icon={<Activity className="h-5 w-5" />}
          label="Active Tasks"
          value={stats?.activeTasks ?? 0}
        />
        <Stat
          icon={<TrendingUp className="h-5 w-5" />}
          label="This Month"
          value={stats?.newMembersThisMonth ?? 0}
          accent
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent users */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Members</h2>
            <Link
              href="/admin/users"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {usersList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No members yet
              </p>
            ) : (
              usersList.slice(0, 6).map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Leaderboard</h2>
          </div>
          <div className="space-y-2">
            {leaderboardList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No rankings yet
              </p>
            ) : (
              leaderboardList.slice(0, 6).map((item: any, i: number) => (
                <div key={item.userId || item.id || i} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm truncate">
                    {item.name || item.user?.name || "Unknown"}
                  </p>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {item.score ?? item.points ?? 0}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Activity feed */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activitiesList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activity
            </p>
          ) : (
            activitiesList.slice(0, 8).map((a: any, i: number) => (
              <div key={a.id || i} className="flex gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-foreground">
                    {a.title || a.message || a.action || "Activity"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ${
        accent ? "glow-primary" : ""
      }`}
    >
      <div className="rounded-lg bg-primary/10 p-2 text-primary w-fit">{icon}</div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}