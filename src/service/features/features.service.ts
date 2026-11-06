/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

const BASE = "/features";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const errorMessage = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

/** FormData থেকে string নাও; খালি হলে undefined */
const str = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

/** Checkbox / switch: "true" | "on" | "1" হলে true; field না থাকলে undefined */
const bool = (formData: FormData, key: string): boolean | undefined => {
  if (!formData.has(key)) return undefined;
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
};

/** "a, b, c" → ["a", "b", "c"] */
const list = (formData: FormData, key: string): string[] | undefined => {
  const raw = formData.get(key);
  if (typeof raw !== "string") return undefined;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

/** undefined field গুলো বাদ দাও (PATCH এ শুধু পাঠানো field update হবে) */
const clean = <T extends Record<string, any>>(obj: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;

const jsonInit = (payload: unknown) => ({
  body: JSON.stringify(payload),
  headers: { "Content-Type": "application/json" },
});

// ═════════════════════════════════════════════════════════════
// FEATURE REQUESTS
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Get Feature Requests
// ─────────────────────────────────────────────────────────────
export async function getFeatureRequests(query?: string) {
  try {
    const response = await serverFetch.get(
      `${BASE}/requests${query ? `?${query}` : ""}`,
      { next: { tags: ["feature-requests"] } }
    );

    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data, meta: result.meta };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch feature requests",
      data: [],
    };
  } catch (error: any) {
    console.error("[getFeatureRequests]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong"),
      data: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Feature Request By Id
// ─────────────────────────────────────────────────────────────
export async function getFeatureRequestById(id: string) {
  try {
    const response = await serverFetch.get(`${BASE}/requests/${id}`, {
      next: { tags: ["feature-requests", `feature-request-${id}`] },
    });

    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch feature request",
      data: null,
    };
  } catch (error: any) {
    console.error("[getFeatureRequestById]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong"),
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create Feature Request
// ─────────────────────────────────────────────────────────────
export async function createFeatureRequest(_prevState: any, formData: FormData) {
  try {
    const payload = clean({
      title: str(formData, "title"),
      description: str(formData, "description"),
      priority: str(formData, "priority"),
      sectorId: str(formData, "sectorId"),
      projectId: str(formData, "projectId"),
    });

    const errors: Record<string, string> = {};
    if (!payload.title) errors.title = "Title is required";
    if (!payload.description) errors.description = "Description is required";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Please fix the errors", errors };
    }

    const response = await serverFetch.post(`${BASE}/requests`, jsonInit(payload));
    const result = await response.json();

    if (result.success) {
      revalidateTag("feature-requests", "max");
      return {
        success: true,
        message: result.message || "Feature request created!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create feature request",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createFeatureRequest]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Feature Request (owner: title/description, admin: status/adminNote ও)
// ─────────────────────────────────────────────────────────────
export async function updateFeatureRequest(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload = clean({
      title: str(formData, "title"),
      description: str(formData, "description"),
      priority: str(formData, "priority"),
      status: str(formData, "status"),
      adminNote: str(formData, "adminNote"),
      sectorId: str(formData, "sectorId"),
      projectId: str(formData, "projectId"),
    });

    if (Object.keys(payload).length === 0) {
      return { success: false, message: "Nothing to update" };
    }

    const response = await serverFetch.patch(
      `${BASE}/requests/${id}`,
      jsonInit(payload)
    );
    const result = await response.json();

    if (result.success) {
      revalidateTag("feature-requests", "max");
      revalidateTag(`feature-request-${id}`, "max");
      return {
        success: true,
        message: result.message || "Feature request updated!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update feature request",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateFeatureRequest]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Feature Request
// ─────────────────────────────────────────────────────────────
export async function deleteFeatureRequest(id: string) {
  try {
    const response = await serverFetch.delete(`${BASE}/requests/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("feature-requests", "max");
      revalidateTag(`feature-request-${id}`, "max");
      return {
        success: true,
        message: result.message || "Feature request deleted!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete feature request",
    };
  } catch (error: any) {
    console.error("[deleteFeatureRequest]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ═════════════════════════════════════════════════════════════
// REPLIES
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Create Reply
// ─────────────────────────────────────────────────────────────
export async function createFeatureReply(
  featureRequestId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload = clean({
      content: str(formData, "content"),
      parentReplyId: str(formData, "parentReplyId"),
    });

    if (!payload.content) {
      return {
        success: false,
        message: "Reply content is required",
        errors: { content: "Content is required" },
      };
    }

    const response = await serverFetch.post(
      `${BASE}/requests/${featureRequestId}/replies`,
      jsonInit(payload)
    );
    const result = await response.json();

    if (result.success) {
      revalidateTag(`feature-request-${featureRequestId}`, "max");
      revalidateTag("feature-requests", "max"); // list এ reply count আছে
      return {
        success: true,
        message: result.message || "Reply added!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to add reply",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createFeatureReply]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Reply
// ─────────────────────────────────────────────────────────────
export async function deleteFeatureReply(
  replyId: string,
  featureRequestId: string
) {
  try {
    const response = await serverFetch.delete(`${BASE}/replies/${replyId}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag(`feature-request-${featureRequestId}`, "max");
      revalidateTag("feature-requests", "max");
      return {
        success: true,
        message: result.message || "Reply deleted!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete reply",
    };
  } catch (error: any) {
    console.error("[deleteFeatureReply]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ═════════════════════════════════════════════════════════════
// FEATURE UPDATES / TECHNICAL REPORTS
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Get Feature Updates
// ─────────────────────────────────────────────────────────────
export async function getFeatureUpdates(query?: string) {
  try {
    const response = await serverFetch.get(
      `${BASE}/updates${query ? `?${query}` : ""}`,
      { next: { tags: ["feature-updates"] } }
    );

    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data, meta: result.meta };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch feature updates",
      data: [],
    };
  } catch (error: any) {
    console.error("[getFeatureUpdates]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong"),
      data: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Feature Update By Id
// ─────────────────────────────────────────────────────────────
export async function getFeatureUpdateById(id: string) {
  try {
    const response = await serverFetch.get(`${BASE}/updates/${id}`, {
      next: { tags: ["feature-updates", `feature-update-${id}`] },
    });

    const result = await response.json();

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch feature update",
      data: null,
    };
  } catch (error: any) {
    console.error("[getFeatureUpdateById]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong"),
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create Feature Update (Admin / Moderator)
// ─────────────────────────────────────────────────────────────
export async function createFeatureUpdate(_prevState: any, formData: FormData) {
  try {
    const payload = clean({
      title: str(formData, "title"),
      content: str(formData, "content"),
      type: str(formData, "type"),
      visibility: str(formData, "visibility"),
      isPinned: bool(formData, "isPinned"),
      version: str(formData, "version"),
      tags: list(formData, "tags"),
      relatedFeatureRequestId: str(formData, "relatedFeatureRequestId"),
      sectorId: str(formData, "sectorId"),
      publishedAt: str(formData, "publishedAt"),
    });

    const errors: Record<string, string> = {};
    if (!payload.title) errors.title = "Title is required";
    if (!payload.content) errors.content = "Content is required";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Please fix the errors", errors };
    }

    const response = await serverFetch.post(`${BASE}/updates`, jsonInit(payload));
    const result = await response.json();

    if (result.success) {
      revalidateTag("feature-updates", "max");
      // related request এর page এ relatedUpdates দেখায়
      if (payload.relatedFeatureRequestId) {
        revalidateTag(`feature-request-${payload.relatedFeatureRequestId}`, "max");
      }
      return {
        success: true,
        message: result.message || "Feature update created!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create feature update",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createFeatureUpdate]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Feature Update (Admin / Moderator)
// ─────────────────────────────────────────────────────────────
export async function updateFeatureUpdate(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload = clean({
      title: str(formData, "title"),
      content: str(formData, "content"),
      type: str(formData, "type"),
      visibility: str(formData, "visibility"),
      isPinned: bool(formData, "isPinned"),
      version: str(formData, "version"),
      tags: list(formData, "tags"),
      relatedFeatureRequestId: str(formData, "relatedFeatureRequestId"),
      sectorId: str(formData, "sectorId"),
      publishedAt: str(formData, "publishedAt"),
    });

    if (Object.keys(payload).length === 0) {
      return { success: false, message: "Nothing to update" };
    }

    const response = await serverFetch.patch(
      `${BASE}/updates/${id}`,
      jsonInit(payload)
    );
    const result = await response.json();

    if (result.success) {
      revalidateTag("feature-updates", "max");
      revalidateTag(`feature-update-${id}`, "max");
      return {
        success: true,
        message: result.message || "Feature update updated!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update feature update",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateFeatureUpdate]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Feature Update (Admin / Moderator)
// ─────────────────────────────────────────────────────────────
export async function deleteFeatureUpdate(id: string) {
  try {
    const response = await serverFetch.delete(`${BASE}/updates/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("feature-updates", "max");
      revalidateTag(`feature-update-${id}`, "max");
      return {
        success: true,
        message: result.message || "Feature update deleted!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete feature update",
    };
  } catch (error: any) {
    console.error("[deleteFeatureUpdate]", error);
    return {
      success: false,
      message: errorMessage(error, "Something went wrong. Please try again."),
    };
  }
}