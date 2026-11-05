import { getProjectById } from "@/service/project/project.service";
import { getTaskById } from "@/service/task/task.service";
import { getUserInfo } from "@/service/auth/getUserInfo";
import { notFound } from "next/navigation";
import ProjectTaskDetailClient from "@/components/modules/projects/ProjectTaskDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 15;

interface Props {
  params: Promise<{ id: string; taskId: string }>;
}

const getNow = () => Date.now();

export default async function ProjectTaskDetailPage({ params }: Props) {
  const { id: projectId, taskId } = await params;

  console.log("[ProjectTaskDetailPage] params →", { projectId, taskId });

  const [projectRes, taskRes, currentUser] = await Promise.all([
    getProjectById(projectId),
    getTaskById(taskId),
    getUserInfo().catch(() => null),
  ]);

  console.log("[ProjectTaskDetailPage] project success:", projectRes.success);
  console.log("[ProjectTaskDetailPage] task success:", taskRes.success);
  console.log("[ProjectTaskDetailPage] task data:", taskRes.data);

  if (!projectRes.success || !projectRes.data) {
    console.error("Project not found");
    notFound();
  }

  if (!taskRes.success || !taskRes.data) {
    console.error("Task not found or forbidden →", taskRes.message);
    notFound();
  }

  // Optional safety check – only if the task actually has projectId
  if (
    taskRes.data.projectId &&
    taskRes.data.projectId !== projectId
  ) {
    console.error("Task does not belong to this project");
    notFound();
  }

  return (
    <ProjectTaskDetailClient
      project={projectRes.data}
      task={taskRes.data}
      currentUserId={currentUser?.id ?? null}
      now={getNow()}
    />
  );
}