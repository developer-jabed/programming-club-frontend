/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { updateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get All Sectors
// ─────────────────────────────────────────────────────────────
export async function getAllSectors(query?: string) {
  try {
    const response = await serverFetch.get(
      `/sectors${query ? `?${query}` : ""}`,
      { next: { tags: ["sectors-list"] } }
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
      message: result.message || "Failed to fetch sectors",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllSectors]", error);
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
// Get Single Sector
// ─────────────────────────────────────────────────────────────
export async function getSectorById(id: string) {
  try {
    const response = await serverFetch.get(`/sectors/${id}`, {
      next: { tags: [`sector-${id}`] },
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
      message: result.message || "Sector not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getSectorById]", error);
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


export async function createSector(_prevState: any, formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();

    if (!name || name.length < 2) {
      return {
        success: false,
        message: "Sector name is required (min 2 characters)",
        errors: { name: "Name is required" },
      };
    }

    // Helper to make a valid slug
    const makeSlug = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")   // remove special chars
        .replace(/[\s_-]+/g, "-")    // spaces/underscores → hyphen
        .replace(/^-+|-+$/g, "");    // trim leading/trailing hyphens

    const rawSlug = (formData.get("slug") as string)?.trim();
    const slug = rawSlug ? makeSlug(rawSlug) : makeSlug(name);

    // Extra safety
    if (!slug) {
      return {
        success: false,
        message: "Could not generate a valid slug",
        errors: { slug: "Invalid slug" },
      };
    }

    const payload = {
      name,
      slug,
      description: (formData.get("description") as string) || undefined,
      icon: (formData.get("icon") as string) || undefined,
      color: (formData.get("color") as string) || undefined,
      order: formData.get("order") ? Number(formData.get("order")) : 0,
      isActive: formData.get("isActive") !== "false",
    };

    console.log("[createSector] payload →", JSON.stringify(payload, null, 2));

    const response = await serverFetch.post("/sectors", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    console.log("[createSector] backend response →", JSON.stringify(result, null, 2));

    if (result.success) {
      updateTag("sectors-list");
      updateTag("admin-dashboard");
      return {
        success: true,
        message: result.message || "Sector created successfully!",
        data: result.data,
      };
    }

    // Better error message from backend
    const backendError =
      result.error?.[0]?.message ||
      result.message ||
      "Failed to create sector";

    return {
      success: false,
      message: backendError,
      errors: result.errors || result.error || {},
    };
  } catch (error: any) {
    console.error("[createSector]", error);
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
// Update Sector
// ─────────────────────────────────────────────────────────────
export async function updateSector(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    ["name", "slug", "description", "icon", "color"].forEach((key) => {
      const value = formData.get(key);
      if (value !== null && value !== "") payload[key] = value;
    });

    if (formData.get("order") !== null) {
      payload.order = Number(formData.get("order"));
    }

    if (formData.get("slug")) {
      const raw = (formData.get("slug") as string).trim();
      payload.slug = raw
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (formData.get("isActive") !== null) {
      payload.isActive = formData.get("isActive") === "true";
    }

    const response = await serverFetch.patch(`/sectors/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      updateTag("sectors-list");
      updateTag(`sector-${id}`);
      return {
        success: true,
        message: result.message || "Sector updated successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update sector",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateSector]", error);
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
// Delete Sector
// ─────────────────────────────────────────────────────────────
export async function deleteSector(id: string) {
  try {
    const response = await serverFetch.delete(`/sectors/${id}`);
    const result = await response.json();

    if (result.success) {
      updateTag("sectors-list");
      updateTag("admin-dashboard");
      return {
        success: true,
        message: result.message || "Sector deleted successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete sector",
    };
  } catch (error: any) {
    console.error("[deleteSector]", error);
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
// Join Sector
// ─────────────────────────────────────────────────────────────
export async function joinSector(id: string) {
  try {
    const response = await serverFetch.post(`/sectors/${id}/join`);
    const result = await response.json();

    if (result.success) {
      updateTag("sectors-list");
      updateTag(`sector-${id}`);
      updateTag(`sector-${id}-members`);
      updateTag("user-info");
      return {
        success: true,
        message: result.message || "Joined sector successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to join sector",
    };
  } catch (error: any) {
    console.error("[joinSector]", error);
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
// Leave Sector
// ─────────────────────────────────────────────────────────────
export async function leaveSector(id: string) {
  try {
    const response = await serverFetch.delete(`/sectors/${id}/leave`);
    const result = await response.json();

    if (result.success) {
      updateTag("sectors-list");
      updateTag(`sector-${id}`);
      updateTag(`sector-${id}-members`);
      updateTag("user-info");
      return {
        success: true,
        message: result.message || "Left sector successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to leave sector",
    };
  } catch (error: any) {
    console.error("[leaveSector]", error);
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
// Get Sector Members
// ─────────────────────────────────────────────────────────────
export async function getSectorMembers(id: string) {
  try {
    const response = await serverFetch.get(`/sectors/${id}/members`, {
      next: { tags: [`sector-${id}-members`] },
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
      message: result.message || "Failed to fetch members",
      data: [],
    };
  } catch (error: any) {
    console.error("[getSectorMembers]", error);
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