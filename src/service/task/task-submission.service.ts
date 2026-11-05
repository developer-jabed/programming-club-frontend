/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { updateTag } from "next/cache";

async function run(
  request: () => Promise<Response>,
  label: string,
  fallback: string,
  onSuccess?: () => void
) {
  try {
    const response = await request();
    const result = await response.json();

    if (result.success) {
      onSuccess?.();
      return {
        success: true,
        message: result.message,
        data: result.data,
        meta: result.meta,
      };
    }

    console.error(`[${label}] backend rejected:`, JSON.stringify(result));
    return {
      success: false,
      message: result.message || fallback,
      errors: result.errors || {},
      data: null as any,
    };
  } catch (error: any) {
    console.error(`[${label}]`, error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
      data: null as any,
    };
  }
}

const json = { "Content-Type": "application/json" };

// formData: content, link, fileUrls (one URL per line or comma separated)
export async function submitTask(taskId: string, _prev: any, formData: FormData) {
  const fileUrls = ((formData.get("fileUrls") as string) || "")
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter(Boolean);

  const payload = {
    content: ((formData.get("content") as string) || "").trim() || undefined,
    link: ((formData.get("link") as string) || "").trim() || undefined,
    fileUrls: fileUrls.length ? fileUrls : undefined,
  };

  return run(
    () =>
      serverFetch.post(`/tasks/${taskId}/submissions`, {
        body: JSON.stringify(payload),
        headers: json,
      }),
    "submitTask",
    "Failed to submit task",
    () => {
      updateTag("my-submissions");
      updateTag(`task-${taskId}-submissions`);
    }
  );
}

export async function updateSubmission(
  submissionId: string,
  payload: { content?: string | null; link?: string | null; fileUrls?: string[] }
) {
  return run(
    () =>
      serverFetch.patch(`/tasks/submissions/${submissionId}`, {
        body: JSON.stringify(payload),
        headers: json,
      }),
    "updateSubmission",
    "Failed to update submission",
    () => {
      updateTag("my-submissions");
      updateTag(`submission-${submissionId}`);
    }
  );
}

export async function deleteSubmission(submissionId: string) {
  return run(
    () => serverFetch.delete(`/tasks/submissions/${submissionId}`),
    "deleteSubmission",
    "Failed to delete submission",
    () => {
      updateTag("my-submissions");
      updateTag(`submission-${submissionId}`);
    }
  );
}

export async function reviewSubmission(
  submissionId: string,
  payload: { status: string; score?: number; feedback?: string },
  taskId?: string
) {
  return run(
    () =>
      serverFetch.patch(`/tasks/submissions/${submissionId}/review`, {
        body: JSON.stringify(payload),
        headers: json,
      }),
    "reviewSubmission",
    "Failed to review submission",
    () => {
      updateTag("my-submissions");
      updateTag(`submission-${submissionId}`);
      if (taskId) updateTag(`task-${taskId}-submissions`);
    }
  );
}



export async function getSubmissionById(submissionId: string) {
  return run(
    () =>
      serverFetch.get(`/tasks/submissions/${submissionId}`, {
        next: { tags: [`submission-${submissionId}`] },
      }),
    "getSubmissionById",
    "Submission not found"
  );
}

export async function getTaskSubmissions(taskId: string, query?: string) {
  return run(
    () =>
      serverFetch.get(`/tasks/${taskId}/submissions${query ? `?${query}` : ""}`, {
        next: { tags: [`task-${taskId}-submissions`] },
      }),
    "getTaskSubmissions",
    "Failed to fetch submissions"
  );
}

export async function getSubmissionSummary(taskId: string) {
  return run(
    () =>
      serverFetch.get(`/tasks/${taskId}/submissions/summary`, {
        next: { tags: [`task-${taskId}-submissions`] },
      }),
    "getSubmissionSummary",
    "Failed to fetch summary"
  );
}