import { getMe } from "@/service/auth/auth.service";
import { getAllProjects } from "@/service/project/project.service";
import { getAllTasks } from "@/service/task/task.service";
import { getAllTests } from "@/service/test/test.service";
import { getLeaderboard } from "@/service/analytics/analytics.service";
import { getMyNotifications } from "@/service/notification/notification.service";
import MemberDashboard from "@/components/modules/dashboard/MemberDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MemberDashboardPage() {
  const [meRes, projectsRes, tasksRes, testsRes, leaderboardRes, notifsRes] =
    await Promise.all([
      getMe(),
      getAllProjects("status=OPEN&limit=6"),
      getAllTasks("limit=8"),
      getAllTests("status=PUBLISHED&limit=6"),
      getLeaderboard(),
      getMyNotifications("limit=5"),
    ]);

  const user = meRes.success ? meRes.data : null;
  const projects = projectsRes.success ? projectsRes.data : [];
  const tasks = tasksRes.success ? tasksRes.data : [];
  const tests = testsRes.success ? testsRes.data : [];
  const leaderboard = leaderboardRes.success ? leaderboardRes.data : [];
  const notifications = notifsRes.success ? notifsRes.data : [];

  return (
    <MemberDashboard
      user={user}
      projects={projects}
      tasks={tasks}
      tests={tests}
      leaderboard={leaderboard}
      notifications={notifications}
    />
  );
}
