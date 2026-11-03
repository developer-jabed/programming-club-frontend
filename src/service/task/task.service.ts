/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get All Tasks
// ─────────────────────────────────────────────────────────────
export async function getAllTasks(query?: string) {
  try {
    const response = await serverFetch.get(
      `/tasks${query ? `?${query}` : ""}`,
      { next: { tags: ["tasks-list"] } }
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
      message: result.message || "Failed to fetch tasks",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllTasks]", error);
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
// Get Single Task
// ─────────────────────────────────────────────────────────────
export async function getTaskById(id: string) {
  try {
    const response = await serverFetch.get(`/tasks/${id}`, {
      next: { tags: [`task-${id}`] },
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
      message: result.message || "Task not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getTaskById]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create Task
// ─────────────────────────────────────────────────────────────
export async function createTask(_prevState: any, formData: FormData) {
  try {
    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as string) || "TODO",
      priority: (formData.get("priority") as string) || "MEDIUM",
      dueDate: (formData.get("dueDate") as string) || undefined,
      maxScore: formData.get("maxScore")
        ? Number(formData.get("maxScore"))
        : undefined,
      projectId: (formData.get("projectId") as string) || undefined,
      sectorId: (formData.get("sectorId") as string) || undefined,
      targetType: (formData.get("targetType") as string) || "SPECIFIC_MEMBERS",
    };

    if (!payload.title) {
      return {
        success: false,
        message: "Task title is required",
        errors: { title: "Title is required" },
      };
    }

    const response = await serverFetch.post("/tasks", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("tasks-list", "max");
      revalidateTag("admin-dashboard", "max");
      if (payload.projectId) {
        revalidateTag(`project-${payload.projectId}`, "max");
      }
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Task
// ─────────────────────────────────────────────────────────────
export async function updateTask(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    ["title", "description", "status", "priority", "dueDate", "projectId", "sectorId", "targetType"].forEach(
      (key) => {
        const value = formData.get(key);
        if (value !== null && value !== "") payload[key] = value;
      }
    );

    if (formData.get("maxScore")) {
      payload.maxScore = Number(formData.get("maxScore"));
    }

    const response = await serverFetch.patch(`/tasks/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("tasks-list", "max");
      revalidateTag(`task-${id}`, "max");
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Task
// ─────────────────────────────────────────────────────────────
export async function deleteTask(id: string) {
  try {
    const response = await serverFetch.delete(`/tasks/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("tasks-list", "max");
      revalidateTag("admin-dashboard", "max");
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
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}
