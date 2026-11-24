/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getDashboardStats,
  getRecentActivities,
  getLeaderboard,
  getProjectStats,
  getMonthlyGrowth,
  getSectorStats,
} from "@/service/analytics/analytics.service";
import AnalyticsClient from "@/components/modules/analytics/AnalyticsClient";
import {
  normalizeLeaderboard,
  parsePeriod,
} from "@/components/modules/leaderboard/leaderboardUtils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);

  const [
    statsRes,
    activitiesRes,
    leaderboardRes,
    projectStatsRes,
    growthRes,
    sectorStatsRes,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentActivities(),
    getLeaderboard({ period, limit: 50 }),
    getProjectStats(),
    getMonthlyGrowth(),
    getSectorStats(),
  ]);

  const failed = [
    ["stats", statsRes],
    ["activities", activitiesRes],
    ["leaderboard", leaderboardRes],
    ["project stats", projectStatsRes],
    ["growth", growthRes],
    ["sector stats", sectorStatsRes],
  ]
    .filter(([, r]: any) => !r.success)
    .map(([name]) => name as string);

  // the leaderboard response is an object now ({ entries, me, ... }), not an array
  const board = normalizeLeaderboard(
    leaderboardRes.success ? leaderboardRes.data : null,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Club health, growth, and performance insights
        </p>
      </div>

      <AnalyticsClient
        stats={statsRes.success ? statsRes.data : null}
        activities={activitiesRes.success ? activitiesRes.data : []}
        leaderboard={board.entries}
        period={period}
        projectStats={projectStatsRes.success ? projectStatsRes.data : null}
        growth={growthRes.success ? growthRes.data : null}
        sectorStats={sectorStatsRes.success ? sectorStatsRes.data : null}
        failed={failed}
      />
    </div>
  );
}