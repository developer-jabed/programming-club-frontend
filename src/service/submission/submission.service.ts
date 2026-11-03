/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Submit Task
// ─────────────────────────────────────────────────────────────
export async function submitTask(
  taskId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const fileUrlsRaw = formData.get("fileUrls") as string;
    const fileUrls = fileUrlsRaw
      ? fileUrlsRaw.split(",").map((u) => u.trim()).filter(Boolean)
      : [];

    const payload = {
      content: (formData.get("content") as string) || undefined,
      link: (formData.get("link") as string) || undefined,
      fileUrls,
    };

    const response = await serverFetch.post(`/submissions/tasks/${taskId}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag(`task-${taskId}`, "max");
      revalidateTag("tasks-list", "max");
      revalidateTag("my-submissions", "max");
      return {
        success: true,
        message: result.message || "Task submitted successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to submit task",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[submitTask]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Task Submissions (for reviewers)
// ─────────────────────────────────────────────────────────────
export async function getTaskSubmissions(taskId: string) {
  try {
    const response = await serverFetch.get(`/submissions/tasks/${taskId}`, {
      next: { tags: [`task-${taskId}-submissions`] },
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch submissions",
      data: [],
    };
  } catch (error: any) {
    console.error("[getTaskSubmissions]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Review Task Submission
// ─────────────────────────────────────────────────────────────
export async function reviewTaskSubmission(
  submissionId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload = {
      status: formData.get("status") as string,
      score: formData.get("score")
        ? Number(formData.get("score"))
        : undefined,
      feedback: (formData.get("feedback") as string) || undefined,
    };

    if (!payload.status) {
      return {
        success: false,
        message: "Status is required",
        errors: { status: "Status is required" },
      };
    }

    const response = await serverFetch.patch(
      `/submissions/tasks/review/${submissionId}`,
      {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (result.success) {
      revalidateTag("tasks-list", "max");
      revalidateTag("my-submissions", "max");
      return {
        success: true,
        message: result.message || "Submission reviewed successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to review submission",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[reviewTaskSubmission]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Submit Project Contribution
// ─────────────────────────────────────────────────────────────
export async function submitProject(
  projectId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const extraLinksRaw = formData.get("extraLinks") as string;
    const extraLinks = extraLinksRaw
      ? extraLinksRaw.split(",").map((u) => u.trim()).filter(Boolean)
      : [];

    const payload = {
      title: (formData.get("title") as string) || undefined,
      description: formData.get("description") as string,
      link: formData.get("link") as string,
      extraLinks,
    };

    if (!payload.description || !payload.link) {
      return {
        success: false,
        message: "Description and link are required",
        errors: {
          description: !payload.description ? "Description is required" : undefined,
          link: !payload.link ? "Link is required" : undefined,
        },
      };
    }

    const response = await serverFetch.post(
      `/submissions/projects/${projectId}`,
      {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (result.success) {
      revalidateTag(`project-${projectId}`, "max");
      revalidateTag("projects-list", "max");
      return {
        success: true,
        message: result.message || "Project contribution submitted!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to submit contribution",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[submitProject]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Review Project Submission
// ─────────────────────────────────────────────────────────────
export async function reviewProjectSubmission(
  submissionId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload = {
      status: formData.get("status") as string,
      score: formData.get("score")
        ? Number(formData.get("score"))
        : undefined,
      feedback: (formData.get("feedback") as string) || undefined,
    };

    if (!payload.status) {
      return {
        success: false,
        message: "Status is required",
        errors: { status: "Status is required" },
      };
    }

    const response = await serverFetch.patch(
      `/submissions/projects/review/${submissionId}`,
      {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (result.success) {
      revalidateTag("projects-list", "max");
      return {
        success: true,
        message: result.message || "Submission reviewed successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to review submission",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[reviewProjectSubmission]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}
