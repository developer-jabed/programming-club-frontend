"use client";

import Link from "next/link";
import { FolderKanban, CheckSquare, ClipboardList, ArrowRight, Activity } from "lucide-react";

interface Props {
  stats: any;
  activities: any[];
  projects: any[];
  tasks: any[];
  tests: any[];
}

export default function ModeratorDashboard({
  stats,
  activities,
  projects,
  tasks,
  tests,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moderator Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage projects, tasks, and tests
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<FolderKanban className="h-5 w-5" />} label="Projects" value={projects.length} href="/manage/projects" />
        <Stat icon={<CheckSquare className="h-5 w-5" />} label="Tasks" value={tasks.length} href="/manage/tasks" />
        <Stat icon={<ClipboardList className="h-5 w-5" />} label="Tests" value={tests.length} href="/manage/tests" />
        <Stat icon={<Activity className="h-5 w-5" />} label="Active" value={stats?.activeTasks ?? 0} accent />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Projects</h2>
            <Link href="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 5).map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/40">
                <span className="text-sm font-medium truncate">{p.title}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{p.status}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Tasks</h2>
            <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/40">
                <span className="text-sm font-medium truncate">{t.title}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{t.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <div className={`rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition ${accent ? "glow-primary" : ""}`}>
      <div className="rounded-lg bg-primary/10 p-2 text-primary w-fit">{icon}</div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
