/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { updateTag } from "next/cache";

// "2026-11-10" -> "2026-11-10T00:00:00.000Z" (backends usually expect full ISO)
function toIsoDate(value: FormDataEntryValue | null): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

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
// Get My Projects (owned by me)
// ─────────────────────────────────────────────────────────────
export async function getMyProjects(query?: string) {
  try {
    const response = await serverFetch.get(
      `/projects/my${query ? `?${query}` : ""}`,
      { next: { tags: ["my-projects"] } }
    );

    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data, meta: result.meta };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch your projects",
      data: [],
    };
  } catch (error: any) {
    console.error("[getMyProjects]", error);
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
// Get Joined Projects (projects I am an ACTIVE member of)
// ─────────────────────────────────────────────────────────────
export async function getJoinedProjects(query?: string) {
  try {
    const response = await serverFetch.get(
      `/projects/joined${query ? `?${query}` : ""}`,
      { next: { tags: ["joined-projects"] } }
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
      message: result.message || "Failed to fetch joined projects",
      data: [],
    };
  } catch (error: any) {
    console.error("[getJoinedProjects]", error);
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
      title: ((formData.get("title") as string) || "").trim(),
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as string) || "OPEN",
      isPublic: formData.get("isPublic") !== "false",
      maxMembers: formData.get("maxMembers")
        ? Number(formData.get("maxMembers"))
        : undefined,
      startDate: toIsoDate(formData.get("startDate")),
      endDate: toIsoDate(formData.get("endDate")),
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
      updateTag("projects-list");
      updateTag("my-projects");
      updateTag("joined-projects");
      updateTag("admin-dashboard");
      return {
        success: true,
        message: result.message || "Project created successfully!",
        data: result.data,
      };
    }

    // Shows the real reason the backend rejected the request
    console.error("[createProject] backend rejected:", {
      payload,
      result: JSON.stringify(result),
    });

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

    const startDate = toIsoDate(formData.get("startDate"));
    const endDate = toIsoDate(formData.get("endDate"));
    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;

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
      updateTag("projects-list");
      updateTag("my-projects");
      updateTag("joined-projects");
      updateTag(`project-${id}`);
      return {
        success: true,
        message: result.message || "Project updated successfully!",
        data: result.data,
      };
    }

    console.error("[updateProject] backend rejected:", {
      payload,
      result: JSON.stringify(result),
    });

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
      updateTag("projects-list");
      updateTag("my-projects");
      updateTag("joined-projects");
      updateTag(`project-${id}`);
      updateTag("admin-dashboard");
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
      updateTag(`project-${id}`);
      updateTag("projects-list");
      updateTag("joined-projects");
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
// Handle Member Request (Accept / Reject / Leave)
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
      updateTag(`project-${projectId}`);
      updateTag("projects-list");
      updateTag("joined-projects");
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