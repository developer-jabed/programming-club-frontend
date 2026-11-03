/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Trophy, Users, FolderKanban, TrendingUp } from "lucide-react";

interface Props {
  stats: any;
  activities: any[];
  leaderboard: any[];
  projectStats: any;
  growth: any;
  sectorStats: any;
}

export default function AnalyticsClient({
  stats,
  activities,
  leaderboard,
  projectStats,
  growth,
  sectorStats,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<Users className="h-5 w-5" />} label="Members" value={stats?.totalUsers ?? 0} />
        <Card icon={<FolderKanban className="h-5 w-5" />} label="Projects" value={stats?.totalProjects ?? 0} />
        <Card icon={<TrendingUp className="h-5 w-5" />} label="Active Tasks" value={stats?.activeTasks ?? 0} />
        <Card icon={<Trophy className="h-5 w-5" />} label="Tests Taken" value={stats?.totalAttempts ?? 0} accent />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Leaderboard
          </h2>
          <div className="space-y-2">
            {(leaderboard || []).slice(0, 10).map((item: any, i: number) => (
              <div key={item.userId || i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                <span className="w-6 text-center text-sm font-bold text-primary">{i + 1}</span>
                <p className="flex-1 text-sm truncate">{item.name || item.user?.name}</p>
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.score ?? item.points ?? 0} pts
                </span>
              </div>
            ))}
            {(!leaderboard || leaderboard.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(activities || []).slice(0, 12).map((a: any, i: number) => (
              <div key={a.id || i} className="flex gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p>{a.title || a.message || a.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No activity</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({
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
    <div className={`rounded-xl border border-border bg-card p-4 ${accent ? "glow-primary" : ""}`}>
      <div className="rounded-lg bg-primary/10 p-2 text-primary w-fit">{icon}</div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
