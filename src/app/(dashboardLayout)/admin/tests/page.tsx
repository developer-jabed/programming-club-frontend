import { getAllTests } from "@/service/test/test.service";
import { getAllProjects } from "@/service/project/project.service";
import { getAllSectors } from "@/service/sector/sector.service";
import TestsClient from "@/components/modules/tests/TestsClient";

export const dynamic = "force-dynamic";

export default async function AdminTestsPage() {
  const [testsRes, projectsRes, sectorsRes] = await Promise.all([
    getAllTests("limit=100&sortBy=createdAt&sortOrder=desc"),
    getAllProjects("limit=50"),
    getAllSectors(),
  ]);

  const tests = testsRes.success ? testsRes.data : [];
  const projects = projectsRes.success ? projectsRes.data : [];
  const sectors = sectorsRes.success ? sectorsRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tests & Quizzes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create, publish, and manage assessments
        </p>
      </div>

      {/* Pass `members={[{ id, name, email }]}` if you have a users service */}
      <TestsClient tests={tests} projects={projects} sectors={sectors} />
    </div>
  );
}