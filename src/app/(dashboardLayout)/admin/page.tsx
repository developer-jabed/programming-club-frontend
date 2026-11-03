import { getDashboardStats, getRecentActivities, getLeaderboard } from "@/service/analytics/analytics.service";
import { getAllUsers } from "@/service/user/user.service";
import { getAllProjects } from "@/service/project/project.service";
import AdminDashboard from "@/components/modules/dashboard/AdminDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function AdminDashboardPage() {
  const [statsRes, activitiesRes, leaderboardRes, usersRes, projectsRes] =
    await Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      getLeaderboard(),
      getAllUsers("limit=8"),
      getAllProjects("limit=6"),
    ]);

  return (
    <AdminDashboard
      stats={statsRes.success ? statsRes.data : null}
      activities={activitiesRes.success ? activitiesRes.data : []}
      leaderboard={leaderboardRes.success ? leaderboardRes.data : []}
      users={usersRes.success ? usersRes.data : []}
      projects={projectsRes.success ? projectsRes.data : []}
    />
  );
}
