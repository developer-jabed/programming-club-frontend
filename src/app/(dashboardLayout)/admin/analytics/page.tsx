import {
  getDashboardStats,
  getRecentActivities,
  getLeaderboard,
  getProjectStats,
  getMonthlyGrowth,
  getSectorStats,
} from "@/service/analytics/analytics.service";
import AnalyticsClient from "@/components/modules/analytics/AnalyticsClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function AnalyticsPage() {
  const [statsRes, activitiesRes, leaderboardRes, projectStatsRes, growthRes, sectorStatsRes] =
    await Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      getLeaderboard(),
      getProjectStats(),
      getMonthlyGrowth(),
      getSectorStats(),
    ]);

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
        leaderboard={leaderboardRes.success ? leaderboardRes.data : []}
        projectStats={projectStatsRes.success ? projectStatsRes.data : null}
        growth={growthRes.success ? growthRes.data : null}
        sectorStats={sectorStatsRes.success ? sectorStatsRes.data : null}
      />
    </div>
  );
}
