import { getMe } from "@/service/auth/auth.service";
import { getAllProjects } from "@/service/project/project.service";
import { getAllTasks } from "@/service/task/task.service";
import { getAllTests } from "@/service/test/test.service";
import { getLeaderboard } from "@/service/analytics/analytics.service";
import { getMyNotifications } from "@/service/notification/notification.service";
import MemberDashboard from "@/components/modules/dashboard/MemberDashboard";
import { normalizeLeaderboard } from "@/components/modules/leaderboard/leaderboardUtils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MemberDashboardPage() {
  const [meRes, projectsRes, tasksRes, testsRes, leaderboardRes, notifsRes] =
    await Promise.all([
      getMe(),
      getAllProjects("status=OPEN&limit=6"),
      getAllTasks("limit=8"),
      getAllTests("status=PUBLISHED&limit=6"),
      // top 5 of the last 30 days; the response also carries the member's own rank
      getLeaderboard({ period: "30d", limit: 5 }),
      getMyNotifications("limit=5"),
    ]);

  const user = meRes.success ? meRes.data : null;
  const projects = projectsRes.success ? projectsRes.data : [];
  const tasks = tasksRes.success ? tasksRes.data : [];
  const tests = testsRes.success ? testsRes.data : [];
  const notifications = notifsRes.success ? notifsRes.data : [];

  // the leaderboard response is an object now ({ entries, me, ... }), not an array
  const board = normalizeLeaderboard(
    leaderboardRes.success ? leaderboardRes.data : null,
  );

  return (
    <MemberDashboard
      user={user}
      projects={projects}
      tasks={tasks}
      tests={tests}
      leaderboard={board.entries}
      me={board.me}
      notifications={notifications}
    />
  );
}