/* eslint-disable @typescript-eslint/no-explicit-any */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type Period =
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "last_month"
  | "all_time";

export type Category = "projects" | "tasks" | "tests" | "badges" | "chat";

export interface LeaderboardBadge {
  name: string;
  iconUrl: string | null;
}

export interface LeaderboardStats {
  tasksCompleted: number;
  testsTaken: number;
  avgTestPercent: number | null;
  messages: number;
  projects: number;
  badgesEarned: number;
  activeDays: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank: number | null;
  rankChange: number | null; // + = moved up, − = moved down, null = no comparison
  isNew: boolean;
  name: string;
  avatar: string | null;
  meta: string; // "Group A · Sem 5"
  points: number;
  pointsChange: number | null;
  percentChange: number | null;
  breakdown: Record<Category, number>;
  stats: LeaderboardStats;
  badges: LeaderboardBadge[];
}

export interface LeaderboardMe extends Omit<LeaderboardEntry, "rank"> {
  rank: number | null; // null = not ranked yet (0 points)
  pointsToNext: number | null;
}

export interface LeaderboardSummary {
  members: number;
  participants: number;
  totalPoints: number;
  averagePoints: number;
  topScore: number;
}

export interface DateRange {
  from: string | null;
  to: string;
}

/** Mirrors SCORING in analytics.service.ts */
export interface ScoringConfig {
  projectSubmissionScoreFactor: number;
  projectSubmissionAccepted: number;
  projectOwned: number;
  projectJoined: number;
  taskScoreFactor: number;
  taskCompleted: number;
  testPercentFactor: number;
  testPassBonus: number;
  messagePoint: number;
  dailyChatPointCap: number;
  badgeEarned: number;
}

export interface LeaderboardView {
  entries: LeaderboardEntry[];
  risingStars: LeaderboardEntry[];
  me: LeaderboardMe | null;
  summary: LeaderboardSummary;
  scoring: ScoringConfig | null;
  range: DateRange | null;
  comparedWith: DateRange | null;
  compared: boolean; // true when the period is compared with a previous one
}

// ─────────────────────────────────────────────────────────────
// Config shared by the page
// ─────────────────────────────────────────────────────────────

export const DEFAULT_PERIOD: Period = "30d";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all_time", label: "All Time" },
];

export const parsePeriod = (value?: string): Period =>
  PERIODS.some((p) => p.value === value) ? (value as Period) : DEFAULT_PERIOD;

/** Ordered by weight: projects matter most, chat least. */
export const CATEGORIES: {
  key: Category;
  label: string;
  bar: string; // tailwind bg class
  weight: string; // how much this source matters
}[] = [
  { key: "projects", label: "Projects", bar: "bg-violet-400", weight: "Biggest" },
  { key: "tasks", label: "Tasks", bar: "bg-rose-400", weight: "Medium" },
  { key: "tests", label: "Tests", bar: "bg-emerald-400", weight: "Small" },
  { key: "badges", label: "Badges", bar: "bg-amber-400", weight: "Small" },
  { key: "chat", label: "Chat", bar: "bg-sky-400", weight: "Tiny" },
];

// ─────────────────────────────────────────────────────────────
// Normalizer
// ─────────────────────────────────────────────────────────────

const toNumber = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
};

const num = (v: unknown, fallback = 0) => toNumber(v) ?? fallback;
const numOrNull = (v: unknown) => toNumber(v) ?? null;

/** Backend defaults, used when a key is missing from the response. */
const DEFAULT_SCORING: ScoringConfig = {
  projectSubmissionScoreFactor: 1,
  projectSubmissionAccepted: 10,
  projectOwned: 10,
  projectJoined: 3,
  taskScoreFactor: 0.3,
  taskCompleted: 2,
  testPercentFactor: 0.1,
  testPassBonus: 2,
  messagePoint: 0.2,
  dailyChatPointCap: 1,
  badgeEarned: 5,
};

function mapScoring(raw: unknown): ScoringConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pick = (key: keyof ScoringConfig) =>
    toNumber(r[key]) ?? DEFAULT_SCORING[key];
  return {
    projectSubmissionScoreFactor: pick("projectSubmissionScoreFactor"),
    projectSubmissionAccepted: pick("projectSubmissionAccepted"),
    projectOwned: pick("projectOwned"),
    projectJoined: pick("projectJoined"),
    taskScoreFactor: pick("taskScoreFactor"),
    taskCompleted: pick("taskCompleted"),
    testPercentFactor: pick("testPercentFactor"),
    testPassBonus: pick("testPassBonus"),
    messagePoint: pick("messagePoint"),
    // older builds used `dailyMessageCap`
    dailyChatPointCap:
      toNumber(r.dailyChatPointCap) ??
      toNumber(r.dailyMessageCap) ??
      DEFAULT_SCORING.dailyChatPointCap,
    badgeEarned: pick("badgeEarned"),
  };
}

function mapRange(raw: unknown): DateRange | null {
  const r = raw as any;
  if (!r || typeof r !== "object" || typeof r.to !== "string") return null;
  return { from: typeof r.from === "string" ? r.from : null, to: r.to };
}

function mapEntry(item: unknown, index: number): LeaderboardEntry {
  const row = (item ?? {}) as any;
  const stats = row.stats ?? {};
  const breakdown = row.breakdown ?? {};

  const meta = [
    row.group ? `Group ${row.group}` : null,
    row.semester ? `Sem ${row.semester}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: String(row.id ?? row.userId ?? index),
    rank: toNumber(row.rank) ?? index + 1,
    previousRank: numOrNull(row.previousRank),
    rankChange: numOrNull(row.rankChange),
    isNew: row.isNew === true,
    name: String(row.name ?? "Unknown member"),
    avatar: row.profilePicture ?? row.avatar ?? null,
    meta,
    // `totalScore` / `completedTasks` keep the old (task-only) response working
    points: num(row.points ?? row.totalScore ?? row.totalPoints ?? row.score),
    pointsChange: numOrNull(row.pointsChange),
    percentChange: numOrNull(row.percentChange),
    breakdown: {
      projects: num(breakdown.projects),
      tasks: num(breakdown.tasks ?? row.totalScore),
      tests: num(breakdown.tests),
      badges: num(breakdown.badges),
      chat: num(breakdown.chat),
    },
    stats: {
      tasksCompleted: num(stats.tasksCompleted ?? row.completedTasks),
      testsTaken: num(stats.testsTaken),
      avgTestPercent: numOrNull(stats.avgTestPercent),
      messages: num(stats.messages),
      projects: num(stats.projects),
      badgesEarned: num(stats.badgesEarned),
      activeDays: num(stats.activeDays),
    },
    badges: Array.isArray(row.badges)
      ? row.badges.map((b: any) => ({
          name: String(b?.name ?? ""),
          iconUrl: b?.iconUrl ?? null,
        }))
      : [],
  };
}

/** Old backend responses had no ranks: sort by points, equal points share a rank. */
function rankLegacy(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => b.points - a.points);
  let lastPoints = -1;
  let lastRank = 0;
  return sorted.map((e, i) => {
    const rank = e.points === lastPoints ? lastRank : i + 1;
    lastPoints = e.points;
    lastRank = rank;
    return { ...e, rank };
  });
}

export function normalizeLeaderboard(raw: unknown): LeaderboardView {
  const data = raw as any;
  const isLegacy = Array.isArray(data);
  const rows: unknown[] = isLegacy
    ? data
    : Array.isArray(data?.entries)
      ? data.entries
      : [];

  let entries = rows.map(mapEntry);
  if (isLegacy || (entries.length > 0 && !rows.some((r: any) => r?.rank))) {
    entries = rankLegacy(entries);
  }

  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);
  const s = data?.summary ?? {};

  const me: LeaderboardMe | null = data?.me
    ? {
        ...mapEntry(data.me, 0),
        rank: numOrNull(data.me.rank),
        pointsToNext: numOrNull(data.me.pointsToNext),
      }
    : null;

  return {
    entries,
    risingStars: Array.isArray(data?.risingStars)
      ? data.risingStars.map(mapEntry)
      : [],
    me,
    summary: {
      members: num(s.members, entries.length),
      participants: num(s.participants, entries.length),
      totalPoints: num(s.totalPoints, totalPoints),
      averagePoints: num(
        s.averagePoints,
        entries.length ? Math.round(totalPoints / entries.length) : 0,
      ),
      topScore: num(s.topScore, entries[0]?.points ?? 0),
    },
    scoring: mapScoring(data?.scoring),
    range: mapRange(data?.range),
    comparedWith: mapRange(data?.comparedWith),
    compared: Boolean(data?.comparedWith),
  };
}

/**
 * Builds the viewer's own card from the ranked list.
 * Used when the backend did not send a matching `me`.
 */
export function deriveMe(
  entries: LeaderboardEntry[],
  id?: string,
): LeaderboardMe | null {
  if (!id) return null;
  const entry = entries.find((e) => e.id === id);
  if (!entry) return null;
  const above = entries.filter((e) => e.points > entry.points);
  const nearest = above[above.length - 1];
  return {
    ...entry,
    pointsToNext: nearest ? nearest.points - entry.points : null,
  };
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────

export const initialOf = (name: string) =>
  name.trim().charAt(0).toUpperCase() || "?";

export const formatPoints = (n: number) => n.toLocaleString("en-US");

/** 10 → "10", 0.3 → "0.3", 0.2999 → "0.3" */
const fmt = (n: number) => String(Math.round(n * 100) / 100);

export const formatDelta = (value: number | null, percent?: number | null) => {
  if (value === null) return "";
  if (value === 0) return "±0";
  const sign = value > 0 ? "+" : "";
  const pct =
    percent !== null && percent !== undefined
      ? ` (${percent > 0 ? "+" : ""}${percent}%)`
      : "";
  return `${sign}${formatPoints(value)}${pct}`;
};

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

/** "25 Oct 2026 – 24 Nov 2026" (Bangladesh time, like the backend). */
export function formatRange(range: DateRange | null): string {
  if (!range) return "";
  const to = dayFormat.format(new Date(range.to));
  if (!range.from) return `Everything until ${to}`;
  return `${dayFormat.format(new Date(range.from))} – ${to}`;
}

// ─────────────────────────────────────────────────────────────
// Rules (generated from the backend's SCORING, so they never drift)
// ─────────────────────────────────────────────────────────────

export interface PointRule {
  key: Category;
  headline: string;
  details: string[];
}

export function getPointRules(s: ScoringConfig): PointRule[] {
  const perMessages =
    s.messagePoint > 0 ? Math.max(1, Math.round(1 / s.messagePoint)) : 0;

  return [
    {
      key: "projects",
      headline: `Reviewer's mark ×${fmt(s.projectSubmissionScoreFactor)}`,
      details: [
        `Each project submission earns the reviewer's mark × ${fmt(s.projectSubmissionScoreFactor)}, plus ${fmt(s.projectSubmissionAccepted)} when it is accepted.`,
        "Only the latest non-rejected submission per project counts.",
        `${fmt(s.projectOwned)} points for creating a project, ${fmt(s.projectJoined)} for joining one (owners are not paid twice).`,
      ],
    },
    {
      key: "tasks",
      headline: `Task mark ×${fmt(s.taskScoreFactor)}`,
      details: [
        `Each task earns its mark × ${fmt(s.taskScoreFactor)}, plus ${fmt(s.taskCompleted)} when completed.`,
        "One result per task: the assignment mark wins, otherwise the latest submission mark.",
        "Rejected submissions earn nothing.",
      ],
    },
    {
      key: "tests",
      headline: `Test % ×${fmt(s.testPercentFactor)}`,
      details: [
        `Test percentage × ${fmt(s.testPercentFactor)} (100% = ${fmt(100 * s.testPercentFactor)} points).`,
        `+${fmt(s.testPassBonus)} for passing: the test's passing marks, or 50% when none is set.`,
        "Every submitted or graded attempt counts.",
      ],
    },
    {
      key: "badges",
      headline: `+${fmt(s.badgeEarned)} per badge`,
      details: [`${fmt(s.badgeEarned)} points for each badge earned in the period.`],
    },
    {
      key: "chat",
      headline: perMessages ? `1 point / ${perMessages} messages` : "No points",
      details: [
        perMessages
          ? `${fmt(s.messagePoint)} points per message, so ${perMessages} messages make 1 point.`
          : "Messages do not earn points.",
        `Capped at ${fmt(s.dailyChatPointCap)} point per member per day (Bangladesh time).`,
        "System messages and deleted messages do not count.",
      ],
    },
  ];
}

export const RANKING_RULES: { title: string; text: string }[] = [
  {
    title: "Who is ranked",
    text: "Active members only. Anyone with 0 points in the period is unranked.",
  },
  {
    title: "What counts",
    text: "Only activity dated inside the selected period: when a mark was given, a task completed, a test submitted, a message sent or a badge earned.",
  },
  {
    title: "Rounding",
    text: "Each category is rounded to a whole number and the total is their sum.",
  },
  {
    title: "Order",
    text: "Higher points first. Ties are broken by more completed tasks, then by name (A–Z).",
  },
  {
    title: "Shared ranks",
    text: "Equal points share a rank, and the next rank is skipped (1, 2, 2, 4).",
  },
  {
    title: "Periods",
    text: "7, 30 and 90 Days count back from now. This Month starts on the 1st and Last Month is the full previous month (Bangladesh time).",
  },
  {
    title: "Movement",
    text: "Every period except All Time is compared with the window of the same length right before it: rank ▲▼, points change, and NEW for first-time entries.",
  },
  {
    title: "Rising stars",
    text: "The five members with the biggest point gain over the previous window.",
  },
];

export interface ExampleRow {
  key: Category;
  label: string;
  points: number;
}

/** A worked example using the live weights. */
export function buildExample(s: ScoringConfig): {
  rows: ExampleRow[];
  total: number;
} {
  const rows: ExampleRow[] = [
    {
      key: "projects",
      label: "Project submission marked 80, accepted",
      points: Math.round(
        80 * s.projectSubmissionScoreFactor + s.projectSubmissionAccepted,
      ),
    },
    {
      key: "tasks",
      label: "Task marked 80, completed",
      points: Math.round(80 * s.taskScoreFactor + s.taskCompleted),
    },
    {
      key: "tests",
      label: "Test scored 90%, passed",
      points: Math.round(90 * s.testPercentFactor + s.testPassBonus),
    },
    {
      key: "badges",
      label: "One badge earned",
      points: Math.round(s.badgeEarned),
    },
    {
      key: "chat",
      label: "A busy chat day (5+ messages)",
      points: Math.round(Math.min(5 * s.messagePoint, s.dailyChatPointCap)),
    },
  ];
  return { rows, total: rows.reduce((sum, r) => sum + r.points, 0) };
}