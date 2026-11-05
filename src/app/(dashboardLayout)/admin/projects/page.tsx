/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getAllProjects,
  getMyProjects,
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

  // Handles both { id } and { data: { id } } shapes
  const currentUserId: string | null =
    currentUser?.id ?? currentUser?.data?.id ?? null;

  const [allRes, myRes, sectorsRes] = await Promise.all([
    getAllProjects("limit=100"),
    currentUserId
      ? getMyProjects("limit=100")
      : Promise.resolve({ success: true, data: [] as any[], message: "" }),
    getAllSectors(),
  ]);

  const allProjects: any[] = allRes.success ? allRes.data ?? [] : [];
  const sectors = sectorsRes.success ? sectorsRes.data ?? [] : [];

  // Owned projects
  let myProjects: any[] = myRes.success ? myRes.data ?? [] : [];
  if (!myRes.success && currentUserId) {
    myProjects = allProjects.filter((p) => p.ownerId === currentUserId);
  }

  const myIds = new Set(myProjects.map((p) => p.id));

  // Projects the user has joined (member but not owner)
  const joinedProjects = allProjects.filter((p) => {
    if (myIds.has(p.id) || p.ownerId === currentUserId) return false;

    // If membership data is available on the project
    const members = p.members ?? [];
    return members.some(
      (m: any) =>
        (m.userId === currentUserId || m.user?.id === currentUserId) &&
        (!m.status || m.status === "ACTIVE")
    );
  });

  const errors: string[] = [];
  if (!allRes.success) errors.push(`All projects: ${allRes.message}`);
  if (!myRes.success) errors.push(`My projects: ${(myRes as any).message}`);
  if (!currentUserId)
    errors.push(
      "Current user id not found (not logged in, or getUserInfo shape differs)"
    );

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
              Projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your projects, explore others, join teams, and build
              together
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
          joinedProjects={joinedProjects}
          sectors={sectors}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}