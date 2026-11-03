/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get All Projects
// ─────────────────────────────────────────────────────────────
export async function getAllProjects(query?: string) {
  try {
    const response = await serverFetch.get(
      `/projects${query ? `?${query}` : ""}`,
      { next: { tags: ["projects-list"] } }
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
      message: result.message || "Failed to fetch projects",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllProjects]", error);
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
// Get Single Project
// ─────────────────────────────────────────────────────────────
export async function getProjectById(id: string) {
  try {
    const response = await serverFetch.get(`/projects/${id}`, {
      next: { tags: [`project-${id}`] },
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
      message: result.message || "Project not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getProjectById]", error);
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
// Create Project
// ─────────────────────────────────────────────────────────────
export async function createProject(_prevState: any, formData: FormData) {
  try {
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as string) || "OPEN",
      isPublic: formData.get("isPublic") !== "false",
      maxMembers: formData.get("maxMembers")
        ? Number(formData.get("maxMembers"))
        : undefined,
      startDate: (formData.get("startDate") as string) || undefined,
      endDate: (formData.get("endDate") as string) || undefined,
      tags,
      sectorId: (formData.get("sectorId") as string) || undefined,
    };

    if (!payload.title) {
      return {
        success: false,
        message: "Project title is required",
        errors: { title: "Title is required" },
      };
    }

    const response = await serverFetch.post("/projects", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("projects-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "Project created successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create project",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createProject]", error);
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
// Update Project
// ─────────────────────────────────────────────────────────────
export async function updateProject(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    ["title", "description", "status", "sectorId"].forEach((key) => {
      const value = formData.get(key);
      if (value !== null && value !== "") payload[key] = value;
    });

    if (formData.get("isPublic") !== null) {
      payload.isPublic = formData.get("isPublic") === "true";
    }

    if (formData.get("maxMembers")) {
      payload.maxMembers = Number(formData.get("maxMembers"));
    }

    if (formData.get("startDate")) payload.startDate = formData.get("startDate");
    if (formData.get("endDate")) payload.endDate = formData.get("endDate");

    const tagsRaw = formData.get("tags") as string;
    if (tagsRaw !== null) {
      payload.tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const response = await serverFetch.patch(`/projects/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("projects-list", "max");
      revalidateTag(`project-${id}`, "max");
      return {
        success: true,
        message: result.message || "Project updated successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update project",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateProject]", error);
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
// Delete Project
// ─────────────────────────────────────────────────────────────
export async function deleteProject(id: string) {
  try {
    const response = await serverFetch.delete(`/projects/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("projects-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "Project deleted successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete project",
    };
  } catch (error: any) {
    console.error("[deleteProject]", error);
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
// Request to Join Project
// ─────────────────────────────────────────────────────────────
export async function requestJoinProject(id: string) {
  try {
    const response = await serverFetch.post(`/projects/${id}/request`);
    const result = await response.json();

    if (result.success) {
      revalidateTag(`project-${id}`, "max");
      revalidateTag("projects-list", "max");
      return {
        success: true,
        message: result.message || "Join request sent successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to send join request",
    };
  } catch (error: any) {
    console.error("[requestJoinProject]", error);
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
// Handle Member Request (Accept / Reject)
// ─────────────────────────────────────────────────────────────
export async function handleProjectMember(
  projectId: string,
  memberId: string,
  status: "ACTIVE" | "REJECTED" | "LEFT"
) {
  try {
    const response = await serverFetch.patch(
      `/projects/${projectId}/members/${memberId}`,
      {
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (result.success) {
      revalidateTag(`project-${projectId}`, "max");
      revalidateTag("projects-list", "max");
      return {
        success: true,
        message: result.message || "Member status updated successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update member status",
    };
  } catch (error: any) {
    console.error("[handleProjectMember]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}
