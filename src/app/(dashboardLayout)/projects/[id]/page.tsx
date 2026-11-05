import { getProjectById } from "@/service/project/project.service";
import { getProjectMessages } from "@/service/chat/chat.service";
import { getAllSectors } from "@/service/sector/sector.service";
import { getUserInfo } from "@/service/auth/getUserInfo";
import { getProjectTasks } from "@/service/task/task.service";
import { notFound } from "next/navigation";
import ProjectDetailClient from "@/components/modules/projects/ProjectDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 20;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  const [projectRes, messagesRes, sectorsRes, tasksRes, currentUser] =
    await Promise.all([
      getProjectById(id),
      getProjectMessages(id, "limit=50"),
      getAllSectors(),
      getProjectTasks(id, "limit=100"),
      getUserInfo().catch(() => null),
    ]);

  if (!projectRes.success || !projectRes.data) {
    notFound();
  }

  return (
    <ProjectDetailClient
      project={projectRes.data}
      messages={messagesRes.success ? messagesRes.data : []}
      sectors={sectorsRes.success ? sectorsRes.data : []}
      tasks={tasksRes.success ? tasksRes.data ?? [] : []}
      currentUserId={currentUser?.id ?? null}
    />
  );
}