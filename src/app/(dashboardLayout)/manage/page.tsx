import { getDashboardStats, getRecentActivities } from "@/service/analytics/analytics.service";
import { getAllProjects } from "@/service/project/project.service";
import { getAllTasks } from "@/service/task/task.service";
import { getAllTests } from "@/service/test/test.service";
import ModeratorDashboard from "@/components/modules/dashboard/ModeratorDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function ModeratorDashboardPage() {
  const [statsRes, activitiesRes, projectsRes, tasksRes, testsRes] =
    await Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      getAllProjects("limit=8"),
      getAllTasks("limit=8"),
      getAllTests("limit=6"),
    ]);

  return (
    <ModeratorDashboard
      stats={statsRes.success ? statsRes.data : null}
      activities={activitiesRes.success ? activitiesRes.data : []}
      projects={projectsRes.success ? projectsRes.data : []}
      tasks={tasksRes.success ? tasksRes.data : []}
      tests={testsRes.success ? testsRes.data : []}
    />
  );
}
