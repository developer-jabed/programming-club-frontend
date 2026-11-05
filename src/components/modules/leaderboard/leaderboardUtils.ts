/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LeaderboardStat {
  label: string;
  value: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string | null;
  points: number;
  meta: string;
  stats: LeaderboardStat[];
}

const toNumber = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
};

const firstNumber = (sources: any[], keys: string[]): number | undefined => {
  for (const key of keys) {
    for (const src of sources) {
      const n = toNumber(src?.[key]);
      if (n !== undefined) return n;
    }
  }
  return undefined;
};

const POINT_KEYS = ["points", "totalPoints", "score", "totalScore", "xp", "total"];

const STAT_KEYS: { label: string; keys: string[] }[] = [
  { label: "Tasks", keys: ["completedTasks", "tasksCompleted", "taskCount", "tasks"] },
  { label: "Tests", keys: ["testsTaken", "testsCompleted", "testCount", "tests"] },
  { label: "Badges", keys: ["badgesCount", "badgeCount", "badges"] },
  { label: "Projects", keys: ["projectCount", "projectsCount", "projects"] },
];

const pickList = (raw: unknown): any[] => {
  if (Array.isArray(raw)) return raw;
  const obj = raw as any;
  for (const key of ["leaderboard", "users", "data", "items", "rows"]) {
    if (Array.isArray(obj?.[key])) return obj[key];
  }
  return [];
};

/**
 * The backend can return flat rows ({ id, name, points }) or rows with a
 * nested user ({ user: { name }, points }). This accepts both so the page
 * doesn't break if the analytics service changes slightly.
 */
export function normalizeLeaderboard(raw: unknown): LeaderboardEntry[] {
  const list = pickList(raw);

  const entries = list.map((item, index): LeaderboardEntry & { backendRank?: number } => {
    const row = (item ?? {}) as any;
    const user = (row.user ?? row) as any;
    const sources = [row, user, row._count, user._count];

    const stats: LeaderboardStat[] = [];
    for (const { label, keys } of STAT_KEYS) {
      const value = firstNumber(sources, keys);
      if (value !== undefined) stats.push({ label, value });
    }

    const meta = [
      user.group ? `Group ${user.group}` : null,
      user.semester ? `Sem ${user.semester}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      id: String(row.userId ?? user.id ?? row.id ?? index),
      rank: index + 1,
      backendRank: toNumber(row.rank),
      name: String(user.name ?? row.name ?? "Unknown member"),
      avatar: user.profilePicture ?? row.profilePicture ?? row.avatar ?? null,
      points: firstNumber(sources, POINT_KEYS) ?? 0,
      meta,
      stats,
    };
  });

  const allRanked = entries.length > 0 && entries.every((e) => e.backendRank !== undefined);

  entries.sort((a, b) =>
    allRanked ? a.backendRank! - b.backendRank! : b.points - a.points,
  );

  // Equal points share a rank (1, 2, 2, 4 …) unless the backend ranked them.
  return entries.map((e, i) => {
    const prev = entries[i - 1];
    const rank = allRanked
      ? e.backendRank!
      : prev && prev.points === e.points
        ? 0 // resolved below
        : i + 1;
    return { ...e, rank };
  }).reduce<LeaderboardEntry[]>((acc, e) => {
    acc.push({ ...e, rank: e.rank === 0 ? acc[acc.length - 1].rank : e.rank });
    return acc;
  }, []);
}

export const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export const formatPoints = (n: number) => n.toLocaleString("en-US");