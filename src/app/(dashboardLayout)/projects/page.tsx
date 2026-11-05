/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getAllProjects,
  getMyProjects,
  getJoinedProjects,
} from "@/service/project/project.service";
import { getAllSectors } from "@/service/sector/sector.service";
import CreateProjectModal from "@/components/modules/projects/CreateProjectModal";
import { getUserInfo } from "@/service/auth/getUserInfo";
import ProjectsClient from "@/components/modules/projects/ProjectsClient";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function AdminProjectsPage() {
  const currentUser: any = await getUserInfo().catch((e) => {
    console.error("[ProjectsPage] getUserInfo failed:", e);
    return null;
  });

  const currentUserId: string | null =
    currentUser?.id ?? currentUser?.data?.id ?? null;

  const [myRes, joinedRes, sectorsRes] = await Promise.all([
    currentUserId
      ? getMyProjects("limit=100")
      : Promise.resolve({ success: true, data: [] as any[] }),
    currentUserId
      ? getJoinedProjects("limit=100")
      : Promise.resolve({ success: true, data: [] as any[] }),
    getAllSectors(),
  ]);

  const myProjects: any[] = myRes.success ? myRes.data ?? [] : [];
  const joinedProjects: any[] = joinedRes.success ? joinedRes.data ?? [] : [];
  const sectors = sectorsRes.success ? sectorsRes.data ?? [] : [];

  // Remove owned projects from the joined list (so they don't appear twice)
  const myIds = new Set(myProjects.map((p) => p.id));
  const joinedOnly = joinedProjects.filter((p) => !myIds.has(p.id));

  const errors: string[] = [];
  if (!myRes.success) errors.push(`My projects: ${(myRes as any).message}`);
  if (!joinedRes.success)
    errors.push(`Joined projects: ${(joinedRes as any).message}`);
  if (!currentUserId)
    errors.push("Current user id not found (not logged in)");

  return (
    <div className="theme-content min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="theme-hero-chip mb-2.5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Projects
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              My Projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Projects you own and projects you belong to
            </p>
          </div>

          <CreateProjectModal sectors={sectors} />
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive space-y-1">
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}

        <ProjectsClient
          myProjects={myProjects}
          joinedProjects={joinedOnly}
          sectors={sectors}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}