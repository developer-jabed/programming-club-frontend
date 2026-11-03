import { getAllProjects } from "@/service/project/project.service";
import { getAllSectors } from "@/service/sector/sector.service";
import ProjectsClient from "@/components/modules/projects/ProjectsClient";
import CreateProjectModal from "@/components/modules/projects/CreateProjectModal";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function ProjectsPage() {
  const [projectsRes, sectorsRes] = await Promise.all([
    getAllProjects(),
    getAllSectors(),
  ]);

  const projects = projectsRes.success ? projectsRes.data : [];
  const sectors = sectorsRes.success ? sectorsRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore open projects, join teams, and build together
          </p>
        </div>
        <CreateProjectModal sectors={sectors} />
      </div>

      <ProjectsClient projects={projects} sectors={sectors} />
    </div>
  );
}
