import { getAllTasks } from "@/service/task/task.service";
import TasksClient from "@/components/modules/tasks/TasksClient";
import { getAllProjects } from "@/service/project/project.service";
import { getAllSectors } from "@/service/sector/sector.service";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasksRes, projectsRes, sectorsRes] = await Promise.all([
    getAllTasks(),
    getAllProjects("limit=50"),
    getAllSectors(),
  ]);

  const tasks = tasksRes.success ? tasksRes.data : [];
  const projects = projectsRes.success ? projectsRes.data : [];
  const sectors = sectorsRes.success ? sectorsRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage assignments, deadlines, and submissions
        </p>
      </div>

      <TasksClient tasks={tasks} projects={projects} sectors={sectors} />
    </div>
  );
}