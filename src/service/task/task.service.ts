/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidatePath, updateTag } from "next/cache";

const TASKS_PATH = "/admin/tasks";
const MEMBER_TASKS_PATH = "/member/tasks";

const errMsg = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

const toISO = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v ? new Date(v).toISOString() : undefined;

const jsonHeaders = { "Content-Type": "application/json" };

// Immediate invalidation (read-your-own-writes) + path refresh
const refresh = (...tags: string[]) => {
  tags.forEach((t) => updateTag(t));
  revalidatePath(TASKS_PATH);
  revalidatePath(MEMBER_TASKS_PATH);
};

// Shared wrapper
async function call(
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
        message: result.message as string,
        data: result.data,
        meta: result.meta,
      };
    }

    console.error(`[${label}] backend rejected:`, JSON.stringify(result));
    return {
      success: false,
      message: (result.message as string) || fallback,
      errors: result.errors || {},
      data: null as any,
    };
  } catch (error: any) {
    console.error(`[${label}]`, error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
      data: null as any,
    };
  }
}

// ═════════════════════════════════════════════════════════════
// TASKS
// ═════════════════════════════════════════════════════════════

export async function getAllTasks(query?: string) {
  try {
    const response = await serverFetch.get(
      `/tasks${query ? `?${query}` : ""}`,
      { next: { tags: ["tasks-list"] } }
    );
    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data, meta: result.meta };
    }
    return {
      success: false,
      message: result.message || "Failed to fetch tasks",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllTasks]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: [],
    };
  }
}

export async function getMyTasks(query?: string) {
  try {
    const response = await serverFetch.get(
      `/tasks/my${query ? `?${query}` : ""}`,
      { cache: "no-store" }
    );
    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data, meta: result.meta };
    }
    return {
      success: false,
      message: result.message || "Failed to fetch your tasks",
      data: [],
    };
  } catch (error: any) {
    console.error("[getMyTasks]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: [],
    };
  }
}

export async function getTaskById(id: string) {
  try {
    const response = await serverFetch.get(`/tasks/${id}`, {
      next: { tags: [`task-${id}`] },
    });
    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      message: result.message || "Task not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getTaskById]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: null,
    };
  }
}

export async function createTask(_prevState: any, formData: FormData) {
  try {
    const projectId = (formData.get("projectId") as string) || undefined;
    const sectorId = (formData.get("sectorId") as string) || undefined;
    let targetType =
      (formData.get("targetType") as string) || "PROJECT_MEMBERS";

    // Smart fallback: if user selected a project but forgot targetType
    if (projectId && targetType === "SPECIFIC_MEMBERS") {
      targetType = "PROJECT_MEMBERS";
    }
    // Smart fallback for sector
    if (sectorId && !projectId && targetType === "SPECIFIC_MEMBERS") {
      targetType = "SECTOR_MEMBERS";
    }

    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as string) || "TODO",
      priority: (formData.get("priority") as string) || "MEDIUM",
      dueDate: toISO(formData.get("dueDate")),
      maxScore: formData.get("maxScore")
        ? Number(formData.get("maxScore"))
        : undefined,
      projectId,
      sectorId,
      targetType,
    };

    if (!payload.title) {
      return {
        success: false,
        message: "Task title is required",
        errors: { title: "Title is required" },
      };
    }

    // Optional validation
    if (targetType === "PROJECT_MEMBERS" && !projectId) {
      return {
        success: false,
        message: "Please select a project when assigning to project members",
      };
    }
    if (targetType === "SECTOR_MEMBERS" && !sectorId) {
      return {
        success: false,
        message: "Please select a sector when assigning to sector members",
      };
    }

    const response = await serverFetch.post("/tasks", {
      body: JSON.stringify(payload),
      headers: jsonHeaders,
    });
    const result = await response.json();

    if (result.success) {
      refresh(
        "tasks-list",
        "admin-dashboard",
        ...(payload.projectId
          ? [`project-${payload.projectId}`, `project-tasks-${payload.projectId}`]
          : [])
      );
      return {
        success: true,
        message: result.message || "Task created successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create task",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createTask]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}


export async function getProjectTasks(projectId: string, query?: string) {
  try {
    const response = await serverFetch.get(
      `/tasks/project/${projectId}${query ? `?${query}` : ""}`,
      { next: { tags: [`project-tasks-${projectId}`] } }
    );
    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch project tasks",
      data: [],
    };
  } catch (error: any) {
    console.error("[getProjectTasks]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: [],
    };
  }
}

export async function updateTask(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    for (const key of ["title", "status", "priority", "targetType"]) {
      const v = formData.get(key);
      if (typeof v === "string" && v !== "") payload[key] = v;
    }

    for (const key of ["description", "projectId", "sectorId"]) {
      if (formData.has(key))
        payload[key] = (formData.get(key) as string) || null;
    }

    if (formData.has("dueDate"))
      payload.dueDate = toISO(formData.get("dueDate")) ?? null;
    if (formData.has("maxScore")) {
      const m = formData.get("maxScore") as string;
      payload.maxScore = m ? Number(m) : null;
    }

    if (formData.has("title") && !payload.title) {
      return {
        success: false,
        message: "Task title is required",
        errors: { title: "Title is required" },
      };
    }

    const response = await serverFetch.patch(`/tasks/${id}`, {
      body: JSON.stringify(payload),
      headers: jsonHeaders,
    });
    const result = await response.json();

    if (result.success) {
      refresh("tasks-list", `task-${id}`, "admin-dashboard");
      return {
        success: true,
        message: result.message || "Task updated successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update task",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateTask]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

export async function updateTaskStatus(id: string, status: string) {
  try {
    const response = await serverFetch.patch(`/tasks/${id}`, {
      body: JSON.stringify({ status }),
      headers: jsonHeaders,
    });
    const result = await response.json();

    if (result.success) {
      refresh("tasks-list", `task-${id}`, "admin-dashboard");
      return { success: true, message: "Status updated" };
    }
    return {
      success: false,
      message: result.message || "Failed to update status",
    };
  } catch (error: any) {
    console.error("[updateTaskStatus]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

export async function deleteTask(id: string) {
  try {
    const response = await serverFetch.delete(`/tasks/${id}`);
    const result = await response.json();

    if (result.success) {
      refresh("tasks-list", `task-${id}`, "admin-dashboard");
      return {
        success: true,
        message: result.message || "Task deleted successfully!",
      };
    }
    return {
      success: false,
      message: result.message || "Failed to delete task",
    };
  } catch (error: any) {
    console.error("[deleteTask]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ═════════════════════════════════════════════════════════════
// SUBMISSIONS
// ═════════════════════════════════════════════════════════════

export async function submitTask(
  taskId: string,
  _prev: any,
  formData: FormData
) {
  const fileUrls = ((formData.get("fileUrls") as string) || "")
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter(Boolean);

  const payload = {
    content: ((formData.get("content") as string) || "").trim() || undefined,
    link: ((formData.get("link") as string) || "").trim() || undefined,
    fileUrls: fileUrls.length ? fileUrls : undefined,
  };

  return call(
    () =>
      serverFetch.post(`/tasks/${taskId}/submissions`, {
        body: JSON.stringify(payload),
        headers: jsonHeaders,
      }),
    "submitTask",
    "Failed to submit task",
    () => refresh("my-submissions", `task-${taskId}-submissions`)
  );
}

export async function updateSubmission(
  submissionId: string,
  payload: {
    content?: string | null;
    link?: string | null;
    fileUrls?: string[];
  }
) {
  return call(
    () =>
      serverFetch.patch(`/tasks/submissions/${submissionId}`, {
        body: JSON.stringify(payload),
        headers: jsonHeaders,
      }),
    "updateSubmission",
    "Failed to update submission",
    () => refresh("my-submissions", `submission-${submissionId}`)
  );
}

export async function deleteSubmission(submissionId: string) {
  return call(
    () => serverFetch.delete(`/tasks/submissions/${submissionId}`),
    "deleteSubmission",
    "Failed to delete submission",
    () => refresh("my-submissions", `submission-${submissionId}`)
  );
}

export async function reviewSubmission(
  submissionId: string,
  payload: { status: string; score?: number; feedback?: string },
  taskId?: string
) {
  return call(
    () =>
      serverFetch.patch(`/tasks/submissions/${submissionId}/review`, {
        body: JSON.stringify(payload),
        headers: jsonHeaders,
      }),
    "reviewSubmission",
    "Failed to review submission",
    () =>
      refresh(
        "my-submissions",
        `submission-${submissionId}`,
        ...(taskId ? [`task-${taskId}-submissions`] : [])
      )
  );
}

export async function getMySubmissions(query?: string) {
  return call(
    () =>
      serverFetch.get(`/tasks/submissions/my${query ? `?${query}` : ""}`, {
        cache: "no-store",
      }),
    "getMySubmissions",
    "Failed to fetch your submissions"
  );
}

export async function getSubmissionById(submissionId: string) {
  return call(
    () =>
      serverFetch.get(`/tasks/submissions/${submissionId}`, {
        next: { tags: [`submission-${submissionId}`] },
      }),
    "getSubmissionById",
    "Submission not found"
  );
}

export async function getTaskSubmissions(taskId: string, query?: string) {
  return call(
    () =>
      serverFetch.get(
        `/tasks/${taskId}/submissions${query ? `?${query}` : ""}`,
        { cache: "no-store" }
      ),
    "getTaskSubmissions",
    "Failed to fetch submissions"
  );
}

export async function getSubmissionSummary(taskId: string) {
  return call(
    () =>
      serverFetch.get(`/tasks/${taskId}/submissions/summary`, {
        cache: "no-store",
      }),
    "getSubmissionSummary",
    "Failed to fetch summary"
  );
}