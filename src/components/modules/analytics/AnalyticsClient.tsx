/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  FolderKanban,
  Layers,
  Loader2,
  RefreshCw,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

interface Props {
  stats: any;
  activities: any;
  leaderboard: any;
  projectStats: any;
  growth: any;
  sectorStats: any;
  failed?: string[];
}

type Point = { label: string; value: number };

const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

// ─────────────────────────────────────────────────────────────
// Shape-tolerant helpers (backend response shapes may vary)
// ─────────────────────────────────────────────────────────────
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

const humanize = (k: string) =>
  k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/**
 * Always returns an array. Accepts:
 *  - a plain array
 *  - a wrapped list: { data: [...] } / { items: [...] } / { activities: [...] } etc.
 *  - a doubly wrapped list: { data: { items: [...] } }
 * Anything else becomes [].
 */
const WRAPPER_KEYS = [
  "data",
  "items",
  "results",
  "rows",
  "list",
  "activities",
  "leaderboard",
  "users",
];

function toArray(input: any, depth = 0): any[] {
  if (Array.isArray(input)) return input;
  if (input == null || typeof input !== "object" || depth > 2) return [];

  for (const k of WRAPPER_KEYS) {
    if (Array.isArray(input[k])) return input[k];
  }
  for (const k of WRAPPER_KEYS) {
    if (input[k] && typeof input[k] === "object") {
      const inner = toArray(input[k], depth + 1);
      if (inner.length > 0) return inner;
    }
  }
  // Fallback: first array-valued property
  for (const v of Object.values(input)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

const LABEL_KEYS = ["label", "name", "title", "month", "status", "period", "date"];
const VALUE_KEYS = ["count", "value", "total", "members", "users", "projects", "tasks"];

function pointFrom(item: any, i: number): Point | null {
  if (item == null) return null;
  if (typeof item === "number") return { label: String(i + 1), value: item };

  let label: string | undefined;
  for (const k of LABEL_KEYS) {
    if (typeof item[k] === "string" && item[k]) {
      label = item[k];
      break;
    }
  }
  label ??= item.sector?.name ?? item.project?.title;

  let value: number | null = null;
  for (const k of VALUE_KEYS) {
    value = num(item[k]);
    if (value !== null) break;
  }
  value ??= num(item._count?.members) ?? num(item._count?.projects);
  if (value === null) {
    for (const v of Object.values(item)) {
      value = num(v);
      if (value !== null) break;
    }
  }
  if (value === null) return null;
  return { label: label ?? String(i + 1), value };
}

function toSeries(input: any): Point[] {
  if (input == null) return [];
  if (Array.isArray(input))
    return input.map(pointFrom).filter((p): p is Point => p !== null);

  if (typeof input === "object") {
    // wrapped list, e.g. { data: [...] } / { months: [...] } / { sectors: [...] }
    for (const v of Object.values(input)) {
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object")
        return toSeries(v);
    }
    // plain map, e.g. { ACTIVE: 4, COMPLETED: 2 }
    // byStatus-style nested maps are flattened one level
    const flat: Point[] = [];
    for (const [k, v] of Object.entries(input)) {
      const n = num(v);
      if (n !== null) flat.push({ label: humanize(k), value: n });
      else if (v && typeof v === "object" && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v as any)) {
          const n2 = num(v2);
          if (n2 !== null) flat.push({ label: humanize(k2), value: n2 });
        }
      }
    }
    return flat;
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────
const KNOWN = [
  { key: "totalUsers", label: "Members", icon: Users },
  { key: "totalProjects", label: "Projects", icon: FolderKanban },
  { key: "activeTasks", label: "Active tasks", icon: TrendingUp },
  { key: "totalAttempts", label: "Tests taken", icon: Trophy, accent: true },
] as const;

export default function AnalyticsClient({
  stats,
  activities,
  leaderboard,
  projectStats,
  growth,
  sectorStats,
  failed = [],
}: Props) {
  const router = useRouter();
  const mounted = useMounted();
  const [isPending, startTransition] = useTransition();
  const [board, setBoard] = useState<"10" | "all">("10");

  const projectSeries = useMemo(() => toSeries(projectStats), [projectStats]);
  const growthSeries = useMemo(() => toSeries(growth), [growth]);
  const sectorSeries = useMemo(() => toSeries(sectorStats), [sectorStats]);

  // Normalize list props so they are always real arrays
  const activityList = useMemo(() => toArray(activities), [activities]);
  const leaderboardList = useMemo(() => toArray(leaderboard), [leaderboard]);

  // Any numeric stat beyond the four known ones is shown too
  const extraStats = useMemo(() => {
    if (!stats || typeof stats !== "object") return [];
    const known = new Set<string>(KNOWN.map((k) => k.key));
    return Object.entries(stats)
      .filter(([k, v]) => !known.has(k) && num(v) !== null)
      .slice(0, 4)
      .map(([k, v]) => ({ label: humanize(k), value: v as number }));
  }, [stats]);

  const rows = leaderboardList.slice(0, board === "10" ? 10 : 50);
  const topScore = Math.max(1, ...rows.map((r: any) => r.score ?? r.points ?? 0));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        {failed.length > 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Could not load: {failed.join(", ")}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KNOWN.map((k) => (
          <StatCard
            key={k.key}
            icon={<k.icon className="h-5 w-5" />}
            label={k.label}
            value={stats?.[k.key] ?? 0}
            accent={"accent" in k && k.accent}
          />
        ))}
      </div>

      {extraStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {extraStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Growth + projects */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Monthly growth" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
          <ColumnChart data={growthSeries} />
        </Panel>
        <Panel title="Projects" icon={<FolderKanban className="h-4 w-4 text-primary" />}>
          <BarList data={projectSeries} />
        </Panel>
      </div>

      {/* Sectors + leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Sectors" icon={<Layers className="h-4 w-4 text-primary" />}>
          <BarList data={sectorSeries} />
        </Panel>

        <Panel
          title="Leaderboard"
          icon={<Trophy className="h-4 w-4 text-primary" />}
          action={
            leaderboardList.length > 10 && (
              <button
                onClick={() => setBoard((b) => (b === "10" ? "all" : "10"))}
                className="text-xs text-primary hover:underline"
              >
                {board === "10" ? "Show more" : "Show top 10"}
              </button>
            )
          }
        >
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {rows.map((item: any, i: number) => {
              const score = item.score ?? item.points ?? 0;
              const name = item.name || item.user?.name || "Unknown";
              return (
                <div
                  key={item.userId || item.id || i}
                  className="rounded-lg px-2 py-1.5 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 text-center text-sm font-bold ${
                        i < 3 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <p className="flex-1 truncate text-sm">{name}</p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {score} pts
                    </span>
                  </div>
                  <div className="ml-9 mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(score / topScore) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <Empty text="No data yet" />}
          </div>
        </Panel>
      </div>

      {/* Activity */}
      <Panel title="Recent activity" icon={<Activity className="h-4 w-4 text-primary" />}>
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {activityList.slice(0, 30).map((a: any, i: number) => (
            <div key={a.id || i} className="flex gap-3 text-sm">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="break-words">
                  {a.title || a.message || a.action}
                  {a.user?.name && (
                    <span className="text-muted-foreground"> · {a.user.name}</span>
                  )}
                </p>
                <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">
                  {mounted && a.createdAt
                    ? format(new Date(a.createdAt), "MMM d, h:mm a")
                    : ""}
                </p>
              </div>
            </div>
          ))}
          {activityList.length === 0 && <Empty text="No activity" />}
        </div>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────
function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function StatCard({
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
      <div className="w-fit rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function BarList({ data }: { data: Point[] }) {
  if (data.length === 0) return <Empty text="No data yet" />;
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{d.label}</span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {d.value}
              {total > 0 && ` · ${Math.round((d.value / total) * 100)}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ColumnChart({ data }: { data: Point[] }) {
  if (data.length === 0) return <Empty text="No data yet" />;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="overflow-x-auto">
      <div className="flex h-48 min-w-fit items-end gap-2">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex h-full w-10 shrink-0 flex-col items-center justify-end gap-1"
          >
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {d.value}
            </span>
            <div
              className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}