import { getAllTasks } from "@/service/task/task.service";
import TasksClient from "@/components/modules/tasks/TasksClient";
import CreateTaskModal from "@/components/modules/tasks/CreateTaskModal";
import { getAllProjects } from "@/service/project/project.service";
import { getAllSectors } from "@/service/sector/sector.service";

export const dynamic = "force-dynamic";
export const revalidate = 30;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your assignments, deadlines, and submissions
          </p>
        </div>
        <CreateTaskModal projects={projects} sectors={sectors} />
      </div>

      <TasksClient tasks={tasks} />
    </div>
  );
}
